import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// Cache public keys to avoid repeated API calls
let publicKeyCache = null;
let publicKeyCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getCognitoPublicKeys() {
  const now = Date.now();
  if (publicKeyCache && (now - publicKeyCacheTime < CACHE_DURATION)) {
    return publicKeyCache;
  }

  const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  const response = await fetch(url);
  const data = await response.json();

  publicKeyCache = data.keys;
  publicKeyCacheTime = now;
  return publicKeyCache;
}

function getPublicKey(kid, keys) {
  return keys.find(key => key.kid === kid);
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer token"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing authorization token'
    });
  }

  try {
    // Decode token header to get kid
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    const kid = decoded.header.kid;
    const keys = await getCognitoPublicKeys();
    const publicKey = getPublicKey(kid, keys);

    if (!publicKey) {
      throw new Error('Public key not found');
    }

    // Reconstruct PEM from JWK
    const pem = jwkToPem(publicKey);

    // Verify token
    const verified = jwt.verify(token, pem, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
    });

    // Attach user info to request
    req.user = {
      userId: verified.sub,
      email: verified.email,
      name: verified.name || verified.email,
      role: verified['custom:role'] || 'Employee',
      teamId: verified['custom:teamId'] || null,
      tokenExpiry: verified.exp
    };

    next();
  } catch (error) {
    console.error('Token validation error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

// Simple JWK to PEM converter
function jwkToPem(jwk) {
  // This is a simplified converter; in production use 'jwk-to-pem' library
  if (jwk.kty !== 'RSA' || !jwk.n || !jwk.e) {
    throw new Error('Invalid JWK format');
  }

  // For now, return a placeholder; in production, use proper conversion
  // eslint-disable-next-line no-console
  console.warn('Using simplified JWK conversion; use jwk-to-pem library in production');
  return jwk;
}

// Role-based access control middleware
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This action requires one of: ${roles.join(', ')}`
      });
    }

    next();
  };
}

// Team-based access control middleware
export function requireTeamAccess(teamIdParam = 'teamId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Managers can access any team
    if (req.user.role === 'Manager') {
      next();
      return;
    }

    // Employees can only access their own team
    const requestedTeamId = req.params[teamIdParam] || req.body.teamId;
    if (req.user.teamId !== requestedTeamId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not belong to this team'
      });
    }

    next();
  };
}
