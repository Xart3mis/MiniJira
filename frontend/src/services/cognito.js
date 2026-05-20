import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || import.meta.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || import.meta.env.REACT_APP_COGNITO_CLIENT_ID
};

export function signInWithCognito(email, password) {
  if (!poolData.UserPoolId || !poolData.ClientId) {
    throw new Error('Missing Cognito configuration');
  }

  const userPool = new CognitoUserPool(poolData);
  const user = new CognitoUser({
    Username: email,
    Pool: userPool
  });

  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err)
    });
  });
}
