import { App } from 'vue';
import { permissionDirective } from '@/utils/permission';

export default {
  install(app: App) {
    app.directive('permission', permissionDirective);
  }
};
