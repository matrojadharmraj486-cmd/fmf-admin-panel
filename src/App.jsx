import { AppRouter } from './routes/AppRouter.jsx'

export default function App({ toggleMode, mode }) {
  return <AppRouter toggleMode={toggleMode} mode={mode} />
}
