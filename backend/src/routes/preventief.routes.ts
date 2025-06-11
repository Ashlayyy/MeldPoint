/* eslint-disable no-unused-expressions */
import { PermissionAction, ResourceType } from '@prisma/client';
import {
  GetAll,
  GetSingle,
  Create,
  Update,
  AddTeamlidToPreventief,
  RewriteTeamlidInPreventief,
  RemoveTeamlidFromPreventief,
  AddCorrespondenceToPreventief,
  RemoveCorrespondenceFromPreventief
} from '../modules/Preventief/controller/PreventiefController';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import createSecureRouter from '../utils/secureRoute';
import { handlePreventiefMeldingNumber } from '../middleware/handleMeldingNumber';
import {
  createPreventiefSchema,
  updatePreventiefSchema,
  getSinglePreventiefSchema,
  addTeamlidSchema,
  rewriteTeamlidSchema,
  removeTeamlidSchema,
  addCorrespondenceSchema,
  removeCorrespondenceSchema
} from '../modules/Preventief/validation/schemas';

const router = createSecureRouter();

// Get all preventief
router.get(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  GetAll
);

// Get single preventief
router.get(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: getSinglePreventiefSchema.shape.params }),
  GetSingle
);

// Create preventief
router.post(
  '/',
  isAuthenticated,
  handlePreventiefMeldingNumber,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ body: createPreventiefSchema.shape.body }),
  Create
);

// Update preventief
router.patch(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: updatePreventiefSchema.shape.params,
    body: updatePreventiefSchema.shape.body
  }),
  Update
);

// Add teamlid
router.post(
  '/teamlid/:meldingID/:teamlidID',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: addTeamlidSchema.shape.params }),
  AddTeamlidToPreventief
);

// Rewrite teamlid
router.patch(
  '/teamlid/:meldingID',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: rewriteTeamlidSchema.shape.params,
    body: rewriteTeamlidSchema.shape.body
  }),
  RewriteTeamlidInPreventief
);

// Remove teamlid
router.delete(
  '/teamlid/:meldingID/:teamlidID',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: removeTeamlidSchema.shape.params }),
  RemoveTeamlidFromPreventief
);

// Add correspondence
router.patch(
  '/correspondence/:preventiefID',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: addCorrespondenceSchema.shape.params,
    body: addCorrespondenceSchema.shape.body
  }),
  AddCorrespondenceToPreventief
);

// Remove correspondence
router.delete(
  '/correspondence/:preventiefID/:CorrespondenceID',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: removeCorrespondenceSchema.shape.params }),
  RemoveCorrespondenceFromPreventief
);

export default router;
