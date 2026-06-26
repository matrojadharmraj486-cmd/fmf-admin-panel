import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Link,
  List,
  ListItem,
  ListItemText
} from '@mui/material'

export default function PrivacyPolicy() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 5, px: 2 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 } }}>
            {/* Header */}
            <Box sx={{ pb: 3, mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 3, fontWeight: 700, display: 'block', mb: 1 }}
              >
                Legal
              </Typography>
              <Typography variant="h4" fontWeight={600} color="text.primary" gutterBottom>
                Privacy Policy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Updated: 01-June-2026
              </Typography>
            </Box>

            {/* Body */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Family Medicine Flashback ("we", "our", or "us") respects your privacy
                and is committed to protecting your personal information.
              </Typography>

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Information We Collect</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  When you register for an account, we may collect:
                </Typography>
                <List dense disablePadding sx={{ pl: 1 }}>
                  {[
                    'Full Name',
                    'Email Address',
                    'Mobile Number',
                    'Address',
                    'Date of Birth',
                    'Profile Photograph',
                    'Billing Information required for purchases'
                  ].map((item) => (
                    <ListItem key={item} sx={{ py: 0.25, display: 'list-item', listStyleType: 'disc', pl: 2 }}>
                      <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>How We Use Information</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  We use the information to:
                </Typography>
                <List dense disablePadding sx={{ pl: 1 }}>
                  {[
                    'Create and manage user accounts',
                    'Provide access to educational content',
                    'Process payments and purchases',
                    'Communicate important account information',
                    'Provide customer support',
                    'Improve application functionality'
                  ].map((item) => (
                    <ListItem key={item} sx={{ py: 0.25, display: 'list-item', listStyleType: 'disc', pl: 2 }}>
                      <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Educational Purpose</Typography>
                <Typography variant="body2" color="text.secondary">
                  Family Medicine Flashback is an educational platform designed for exam
                  preparation through question-and-answer based learning content. The
                  application does not provide medical diagnosis, treatment recommendations,
                  or healthcare services.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Data Sharing</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  We do not sell, rent, or share user personal information with advertisers
                  or data brokers.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We may share limited information with service providers only when necessary
                  to provide app functionality and payment processing.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Tracking</Typography>
                <Typography variant="body2" color="text.secondary">
                  Family Medicine Flashback does not track users across third-party
                  applications, websites, or services for advertising purposes.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Data Security</Typography>
                <Typography variant="body2" color="text.secondary">
                  We implement reasonable administrative and technical measures to protect
                  user information against unauthorized access, disclosure, or misuse.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>User Rights</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Users may request account updates or deletion by contacting us at:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email:{' '}
                  <Link href="mailto:help@familymedicineflashback.com" color="primary">
                    help@familymedicineflashback.com
                  </Link>
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Children's Privacy</Typography>
                <Typography variant="body2" color="text.secondary">
                  Our services are not intended for children under the age required by
                  applicable laws.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Contact Us</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  If you have any questions regarding this Privacy Policy, please contact:
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email:{' '}
                  <Link href="mailto:help@familymedicineflashback.com" color="primary">
                    help@familymedicineflashback.com
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Website:{' '}
                  <Link href="https://familymedicineflashback.com" target="_blank" rel="noreferrer" color="primary">
                    familymedicineflashback.com
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
