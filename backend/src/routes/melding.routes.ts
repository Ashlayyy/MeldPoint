import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import { handleMeldingNumber } from '../middleware/handleMeldingNumber';
import createSecureRouter from '../utils/secureRoute';
import {
  GetLengths,
  GetAllReports,
  GetSingleReport,
  CreateReport,
  UpdateReport,
  AddCloneID,
  RemoveCloneID,
  AddCorrespondenceID,
  RemoveCorrespondenceID,
  SetCorrespondenceIDs,
  FindReportByPreventiefID,
  GetSingleReportByVolgnummer
} from '../modules/Melding/controller/MeldingController';
import {
  createMeldingSchema,
  updateMeldingSchema,
  cloneManagementSchema,
  correspondenceSchema,
  setCorrespondenceSchema,
  preventiefSearchSchema
} from '../modules/Melding/validation/schemas';

const router = createSecureRouter();

router.use(hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]));

// Protected routes
router.get('/', isAuthenticated, GetAllReports);
router.get('/:id', isAuthenticated, GetSingleReport);
router.get('/volgnummer/:volgnummer', isAuthenticated, GetSingleReportByVolgnummer);
router.get('/fetch/lengths', isAuthenticated, GetLengths);
router.post(
  '/',
  isAuthenticated,
  handleMeldingNumber,
  //validateZodRequest({ body: createMeldingSchema.shape.body }),
  CreateReport
);

router.patch(
  '/:id',
  isAuthenticated,
  //validateZodRequest({
  //  params: updateMeldingSchema.shape.params,
  //  body: updateMeldingSchema.shape.body
  //}),
  UpdateReport
);

// Clone management
router.post(
  '/clone/:meldingID/:cloneID',
  isAuthenticated,
  //validateZodRequest({ params: cloneManagementSchema.shape.params }),
  AddCloneID
);

router.delete(
  '/clone/:meldingID/:cloneID',
  isAuthenticated,
  //validateZodRequest({ params: cloneManagementSchema.shape.params }),
  RemoveCloneID
);

// Correspondence management
router.patch(
  '/correspondence/:meldingID',
  isAuthenticated,
  //validateZodRequest({ params: correspondenceSchema.shape.params }),
  AddCorrespondenceID
);

router.delete(
  '/correspondence/:meldingID/:correspondenceID',
  isAuthenticated,
  //validateZodRequest({ params: correspondenceSchema.shape.params }),
  RemoveCorrespondenceID
);

router.post(
  '/correspondence/:meldingID',
  isAuthenticated,
  //validateZodRequest({
  //  params: setCorrespondenceSchema.shape.params,
  //  body: setCorrespondenceSchema.shape.body
  //}),
  SetCorrespondenceIDs
);

router.get(
  '/preventief/:preventiefId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  //validateZodRequest({ params: preventiefSearchSchema.shape.params }),
  FindReportByPreventiefID
);

export default router;
