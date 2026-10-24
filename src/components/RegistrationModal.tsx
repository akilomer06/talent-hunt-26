import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ON_SPOT_REGISTRATION_NOTICE } from '../../shared/registrationRules';

export const RegistrationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Online registration is closed</DialogTitle><DialogDescription>{ON_SPOT_REGISTRATION_NOTICE}</DialogDescription></DialogHeader>
      <p>Visit the respective event venue on 26 October 2026 and speak to the coordinators. Bring your Crescent Student ID.</p>
    </DialogContent>
  </Dialog>
);
