import { documentationPath } from 'lib/constants';

export const rootPaths = {
  root: '/admin',
  authRoot: 'auth',
};

const paths = {
  root: rootPaths.root,
  users: `${rootPaths.root}/users`,
  account: `${rootPaths.root}/account`,
  applications: `${rootPaths.root}/apps`,
  login: `/login`,
  signup: `/signup`,
  notifications: `/notifications`,
  documentation: documentationPath,

  404: `/404`,
};

export default paths;
