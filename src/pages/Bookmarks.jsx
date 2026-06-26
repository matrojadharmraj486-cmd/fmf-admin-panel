import { useState } from 'react'
import {
  Box, Card, Typography, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer
} from '@mui/material'

export default function Bookmarks() {
  const [items, setItems] = useState([
    { id: 1, user: 'User 1', question: 'What is anatomy?', year: '2022', subject: 'Anatomy' },
    { id: 2, user: 'User 2', question: 'Define physiology.', year: '2023', subject: 'Physiology' }
  ])
  const remove = (id) => setItems((x) => x.filter((i) => i.id !== id))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h5" fontWeight={600}>Bookmarks</Typography>
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id} hover>
                  <TableCell>{i.user}</TableCell>
                  <TableCell>{i.question}</TableCell>
                  <TableCell>{i.year}</TableCell>
                  <TableCell>{i.subject}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => remove(i.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}
