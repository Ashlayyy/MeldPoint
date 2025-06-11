/* eslint-disable no-underscore-dangle */
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { v4 as uuidv4 } from 'uuid';
import { updateUserGroup } from '../../db/queries/updateQueries';
import { FindUserByEmail, UpdateUser } from '../../modules/User/controller/UserController';
import { create } from '../../modules/User/service/UserService';
import logger from '../../helpers/loggerInstance';

const defaultGroupID =
  process.env.ENABLE_DEV_DATABASE === 'true'
    ? (process.env.STANDARD_USER_GROUP_ID_DEV as string)
    : (process.env.STANDARD_USER_GROUP_ID as string);

const microsoftStrategy = new MicrosoftStrategy(
  {
    clientID: process.env.MICROSOFT_CLIENT_ID as string,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    callbackURL:
      process.env.NODE_ENV === 'development'
        ? process.env.MICROSOFT_CALLBACK_URL_DEVELOPMENT
        : process.env.MICROSOFT_CALLBACK_URL_PRODUCTION,
    scope: ['openid', 'user.read', 'email', 'profile'],
    tenant: process.env.MICROSOFT_TENANT_ID as string
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: { id: string; displayName: string; _json: { mail?: string; userPrincipalName?: string } },
    done: (error: any, user?: any) => void
  ) => {
    const traceId = uuidv4();
    const authContext = {
      traceId,
      source: 'microsoft_strategy',
      microsoftUserId: profile.id,
      displayName: profile.displayName
    };

    try {
      logger.info('Processing Microsoft authentication', authContext);

      const email = profile._json.mail || profile._json.userPrincipalName;
      if (!email) {
        logger.error('No email found in Microsoft profile', new Error('Missing email'), {
          ...authContext,
          profile: JSON.stringify(profile)
        });
        return done(new Error('No email found in Microsoft profile'));
      }

      logger.debug('Looking up user by email', {
        ...authContext,
        email
      });

      const existingUser = await FindUserByEmail(email);

      if (existingUser && existingUser.MicrosoftId) {
        logger.info('Existing user found, updating login details', {
          ...authContext,
          userId: existingUser.id,
          email
        });

        await UpdateUser(existingUser.id, {
          lastLogin: new Date()
        });

        logger.debug('Updating user group', {
          ...authContext,
          userId: existingUser.id,
          groupId: defaultGroupID
        });

        await updateUserGroup(existingUser.id, {
          groupID: defaultGroupID
        });

        logger.info('User authentication successful', {
          ...authContext,
          userId: existingUser.id,
          email,
          groupId: defaultGroupID
        });

        return done(null, existingUser);
      }

      logger.info('Creating new user account', {
        ...authContext,
        email
      });

      const user = await create({
        Name: profile.displayName,
        Email: email,
        MicrosoftId: profile.id,
        lastLogin: new Date(),
        groupID: defaultGroupID
      });

      logger.info('New user account created successfully', {
        ...authContext,
        userId: user.id,
        email,
        groupId: defaultGroupID
      });

      return done(null, user);
    } catch (error: any) {
      logger.error('Microsoft authentication failed', error, {
        ...authContext,
        errorCode: error.code,
        errorMessage: error.message,
        stackTrace: error.stack
      });
      return done(error);
    }
  }
);

export default microsoftStrategy;
