import passport from 'passport';
import { User } from '../../interfaces/User';
import microsoftStrategy from './microsoft.strategy';
import { FindUserById } from '../../modules/User/controller/UserController';
import logger from '../../helpers/loggerInstance';

export default function configurePassport() {
  passport.use(microsoftStrategy);

  passport.serializeUser((user: User, done: any) => {
    logger.debug(`Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done: any) => {
    try {
      logger.debug(`Deserializing user: ${id}`);
      const user = await FindUserById(id);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      logger.error(`Error deserializing user: ${error}`);
      return done(error);
    }
  });
}
