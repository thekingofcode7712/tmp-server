import { toast } from 'sonner';

export function notifyNewEmail(from: string, subject: string) {
  toast.info('New Email', {
    description: `From: ${from}\nSubject: ${subject}`,
    duration: 5000,
  });
}

export function notifyStorageWarning(usedPercent: number) {
  if (usedPercent >= 90) {
    toast.warning('Storage Almost Full', {
      description: `You've used ${usedPercent.toFixed(0)}% of your storage. Consider upgrading your plan.`,
      duration: 8000,
    });
  } else if (usedPercent >= 75) {
    toast('Storage Warning', {
      description: `You've used ${usedPercent.toFixed(0)}% of your storage.`,
      duration: 5000,
    });
  }
}

export function notifySubscriptionUpdate(tier: string, action: 'upgraded' | 'downgraded' | 'renewed') {
  const messages = {
    upgraded: `Successfully upgraded to ${tier} plan!`,
    downgraded: `Successfully downgraded to ${tier} plan.`,
    renewed: `Your ${tier} subscription has been renewed.`,
  };
  
  toast.success('Subscription Updated', {
    description: messages[action],
    duration: 5000,
  });
}

export function notifyAddonPurchased(addonName: string) {
  toast.success('Add-on Purchased', {
    description: `${addonName} has been added to your account!`,
    duration: 5000,
  });
}

export function notifyFileUploaded(fileName: string, fileSize: number) {
  const sizeKB = (fileSize / 1024).toFixed(2);
  toast.success('File Uploaded', {
    description: `${fileName} (${sizeKB} KB) uploaded successfully.`,
    duration: 3000,
  });
}

export function notifyBackupCreated(backupName: string) {
  toast.success('Backup Created', {
    description: `Backup "${backupName}" created successfully.`,
    duration: 4000,
  });
}
