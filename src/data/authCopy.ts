export const AUTH_COPY = {
  adminRequestButton: 'Request Admin Access',
  adminRequestPending:
    'Your admin access request has been sent for approval. After it is approved, sign out and sign back in to get admin access.',
  departmentSignupHelp:
    'New users can create department accounts here. After sign up, check your inbox and spam folder for the verification email. Admin accounts are assigned separately.',
  emailVerificationSent:
    'Verification email sent. Verify your email to continue, and check your spam folder if you do not see it in your inbox.',
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
    'Need admin access? Send a request and the main administrator can approve it by email. After approval, sign out and sign back in.',
  workEmailMissing: 'Please enter your work email.',
} as const
