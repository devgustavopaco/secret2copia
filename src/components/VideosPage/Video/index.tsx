import { Videos } from '@prisma/client'
import dynamic from 'next/dynamic'
import { PlayerProps } from '../Player/Player'
import { DesktopVideoComponent } from './Desktop'
import { MobileVideoComponent } from './Mobile'

const PlayerComponent = dynamic<PlayerProps>(
  () => import('../Player/Player').then((module) => module.PlayerComponent),
  {
    ssr: false,
  }
)

interface videoProps {
  aula: Videos

  data: Videos[]
}

export function VideoComponent({ aula, data }: videoProps) {
  return (
    <>
      <MobileVideoComponent aula={aula} data={data} />
      <DesktopVideoComponent aula={aula} data={data} />
    </>
  )
}
