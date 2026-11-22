import { Router } from 'express';
import { OrganizationController } from './organizationController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, OrganizationController.list);
router.post('/', authenticate, OrganizationController.create);
router.get('/:id', authenticate, OrganizationController.getById);

export default router;
