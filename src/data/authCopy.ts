export const AUTH_COPY = {
  adminRequestButton: 'Request Admin Access',
  adminRequestPending:
    'Your admin access request has been sent for approval.',
  departmentSignupHelp:
    'New users can create department accounts here. Admin accounts are assigned separately.',
  emailVerificationSent:
    'Verification email sent. Verify your email to continue.',
  emailVerificationPending:
    'Your account is signed in, but email verification is still pending.',
  emailVerificationRefreshPending:
    'Still waiting for verification. Open the email link, then refresh again.',
  emailVerificationRefreshSuccess:
    'Email verified. You can continue now.',
  refreshVerificationButton: "I've Verified It",
  resendVerificationButton: 'Resend Verification Email',
  manualAdminHelp:
    'Use at least 8 characters. Admin accounts must be granted through Firebase admin role setup.',
  passwordMinLength: 'Password should be at least 8 characters long.',
  passwordResetSent:
    'Password reset email sent. Please check your inbox and spam folder.',
  profileHelp:
    'Sign in with your Firebase email/password account. The matching role for this user should exist in Firestore under the `users` collection using the auth UID as the document id.',
  requestAdminHelp:
    'Need admin access? Send a request and the main administrator can approve it by email.',
  workEmailMissing: 'Please enter your work email.',
} as const
