const REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_COGNITO_CLIENT_SECRET || '';
const ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

async function computeSecretHash(username) {
  if (!CLIENT_SECRET) return undefined;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(CLIENT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(username + CLIENT_ID));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function cognitoRequest(target, body) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || data.Message || target + ' failed');
    err.code = data.__type || data.code;
    throw err;
  }
  return data;
}

export async function signIn(email, password) {
  const SecretHash = await computeSecretHash(email);
  const AuthParameters = { USERNAME: email, PASSWORD: password };
  if (SecretHash) AuthParameters.SECRET_HASH = SecretHash;

  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters,
  });

  if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return {
      challenge: 'NEW_PASSWORD_REQUIRED',
      session: data.Session,
      username: email,
    };
  }

  if (data.ChallengeName) {
    throw new Error(`Unsupported challenge: ${data.ChallengeName}`);
  }

  return {
    idToken: data.AuthenticationResult.IdToken,
    accessToken: data.AuthenticationResult.AccessToken,
    refreshToken: data.AuthenticationResult.RefreshToken,
  };
}

export async function respondToNewPasswordChallenge(username, newPassword, session) {
  const SecretHash = await computeSecretHash(username);
  const ChallengeResponses = { USERNAME: username, NEW_PASSWORD: newPassword };
  if (SecretHash) ChallengeResponses.SECRET_HASH = SecretHash;

  const data = await cognitoRequest('RespondToAuthChallenge', {
    ClientId: CLIENT_ID,
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    Session: session,
    ChallengeResponses,
  });

  if (data.ChallengeName) {
    throw new Error(`Unsupported challenge: ${data.ChallengeName}`);
  }

  return {
    idToken: data.AuthenticationResult.IdToken,
    accessToken: data.AuthenticationResult.AccessToken,
    refreshToken: data.AuthenticationResult.RefreshToken,
  };
}

export async function signUp(email, password, { name, role, teamId }) {
  const SecretHash = await computeSecretHash(email);
  const UserAttributes = [
    { Name: 'name', Value: name },
    { Name: 'custom:role', Value: role },
  ];
  if (teamId) UserAttributes.push({ Name: 'custom:teamid', Value: teamId });

  const body = { ClientId: CLIENT_ID, Username: email, Password: password, UserAttributes };
  if (SecretHash) body.SecretHash = SecretHash;

  return cognitoRequest('SignUp', body);
}

export async function confirmSignUp(email, code) {
  const SecretHash = await computeSecretHash(email);
  const body = { ClientId: CLIENT_ID, Username: email, ConfirmationCode: code };
  if (SecretHash) body.SecretHash = SecretHash;
  return cognitoRequest('ConfirmSignUp', body);
}

export async function forgotPassword(email) {
  const SecretHash = await computeSecretHash(email);
  const body = { ClientId: CLIENT_ID, Username: email };
  if (SecretHash) body.SecretHash = SecretHash;
  return cognitoRequest('ForgotPassword', body);
}

export async function confirmNewPassword(email, code, newPassword) {
  const SecretHash = await computeSecretHash(email);
  const body = {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  };
  if (SecretHash) body.SecretHash = SecretHash;
  return cognitoRequest('ConfirmForgotPassword', body);
}

export function signOut() {
  // Token is stateless — clearing local state in authStore is sufficient.
  // For a full server-side invalidation, call GlobalSignOut with the access token.
}
