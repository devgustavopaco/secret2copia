import { Check, Image } from 'phosphor-react'
import { useDropzone } from 'react-dropzone'

import styles from './styles.module.scss'

interface ImageDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void
}

export function ImageDropzone({ onDrop }: ImageDropzoneProps) {
  const {
    acceptedFiles,
    isFocused,
    isDragActive,
    getRootProps,
    getInputProps,
  } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
    maxFiles: 1,
    onDrop,
  })

  const file = acceptedFiles[0]

  const isActive = isDragActive || isFocused

  return (
    <div
      className={`${styles.dropzone} ${isActive ? 'isFocused' : ''} ${
        file ? 'hasFile' : ''
      }`}
      {...getRootProps()}
    >
      <input {...getInputProps({ multiple: false })} />
      {file ? <Check size={48} weight="bold" /> : <Image size={48} />}
      {file && <span>Arquivo selecionado:</span>}
      <p>
        {file
          ? file.name
          : 'Clique para selecionar a imagem ou arraste e solte a imagem aqui'}
      </p>
    </div>
  )
}
