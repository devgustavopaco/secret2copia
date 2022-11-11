import { Videos } from '@prisma/client'
import dynamic from 'next/dynamic'
import {
  CaretRight,
  DiscordLogo,
  FileArrowDown,
  Lightning,
} from 'phosphor-react'
import { useState } from 'react'
import { MobileClassScheduleComponent } from '../../ClassSchedule/Mobile'
import { PlayerProps } from '../../Player/Player'
import styles from './styles.module.scss'

const PlayerComponent = dynamic<PlayerProps>(
  () => import('../../Player/Player').then((module) => module.PlayerComponent),
  {
    ssr: false,
  }
)

interface videoProps {
  aula: Videos

  data: Videos[]
}

export function MobileVideoComponent({ aula, data }: videoProps) {
  const [toggleState, setToggleState] = useState<'conteudo' | 'aulas'>(
    'conteudo'
  )
  const [isConteudo, isConteudoState] = useState<boolean>(false)

  const toggleTab = (tab: 'conteudo' | 'aulas') => {
    setToggleState(tab)
    if (toggleState == 'conteudo') {
      isConteudoState(true)
    } else {
      isConteudoState(false)
    }
  }

  return (
    <div className={styles.videoSection}>
      <PlayerComponent aula={aula} />
      <div className={styles.blocTabs}>
        <button
          className={`${styles.tabs} ${
            toggleState === 'conteudo' ? 'activeConteudo' : ''
          }`}
          onClick={() => toggleTab('conteudo')}
        >
          Visão geral
        </button>
        <button
          className={`${styles.tabs} ${
            toggleState === 'aulas' ? 'activeAulas' : ''
          }`}
          onClick={() => toggleTab('aulas')}
        >
          Conteúdo do curso
        </button>
      </div>
      {toggleState === 'conteudo' ? (
        <>
          <div className={styles.classDescription}>
            <div className={styles.classText}>
              <h2>{aula ? aula.title : ''}</h2>
              <p>{aula ? aula.description : ''}</p>
            </div>
            <div className={styles.btnList}>
              <button className={styles.discordBtn}>
                <DiscordLogo size={20} />
                COMUNIDADE NO DISCORD
              </button>
              <button className={styles.challengeBtn}>
                <Lightning size={20} />
                ACESSE O DESAFIO
              </button>
            </div>
          </div>
          <div className={styles.creatorDescription}>
            <img
              src="/images/Users/NigreCliente.jpg"
              className={styles.nigreImg}
            />
            <div className={styles.creatorName}>
              <h2>José Nigre</h2>
              <span>Fundador e CEO na NextGain</span>
            </div>
          </div>
          <div className={styles.additionalMaterial}>
            <div className={styles.material}>
              <div className={styles.iconBackground}>
                <FileArrowDown size={32} />
              </div>
              <div className={styles.materialText}>
                <div className={styles.text}>
                  <h2>Material complementar</h2>
                  <span>
                    Acesse o material complementar para acelerar o seu
                    desenvolvimento
                  </span>
                </div>
                <CaretRight size={32} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <MobileClassScheduleComponent data={data} />
      )}
      <div className={styles.footer}>
        <div className={styles.divisor}></div>
        <span>NextGain - Todos os direitos reservados</span>
      </div>
    </div>
  )
}
