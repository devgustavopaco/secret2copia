import { useId } from 'react'
import Select, { OnChangeValue } from 'react-select'
import styles from './styles.module.scss'

interface exchangesType {
  value: string
  label: string
}

interface SelectProps {
  defaultExchanges: exchangesType[]
  selectedExchanges: string[]
  onSelectSellExchangeMobile: (
    exchange: readonly exchangesType[] | undefined
  ) => void
}

const groupStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
const groupBadgeStyles: any = {
  backgroundColor: '#000000',
  borderRadius: '2em',
  color: '#000000',
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 'normal',
  lineHeight: '1',
  minWidth: 1,
  padding: '0.16666666666667em 0.5em',
  textAlign: 'center',
}

const formatGroupLabel: any = (data: any) => (
  <div style={groupStyles}>
    <span>{data.label}</span>
    <span style={groupBadgeStyles}>{data.options.length}</span>
  </div>
)

const multiValueContainer: any = ({ selectProps, data }: any) => {
  const label = data.label
  const allSelected = selectProps.value
  const index = allSelected.findIndex(
    (selected: any) => selected.label === label
  )
  const isLastSelected = index === allSelected.length - 1
  const labelSuffix = isLastSelected ? ` (${allSelected.length})` : ', '
  const val = `${label}${labelSuffix}`
  return val
}

const customStyles = {
  valueContainer: (provided: any, state: any) => ({
    ...provided,
    textOverflow: 'ellipsis',
    border: 'none',
    boxShadow: 'none',
    outline: state.isFocused ? 'var(--purple-500) solid 2px' : 'none',
    outlineOffset: '1px',
    maxWidth: '90%',
    height: '40px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'initial',
  }),
  control: (provided: any, state: any) => ({
    ...provided,
    border: 'none',
    boxShadow: 'none',
    outline: state.isFocused ? 'var(--purple-500) solid 2px' : 'none',
    outlineOffset: '1px',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    color: state.isSelected ? 'var(--gray-100)' : 'var(--gray-100)',
    backgroundColor: state.isSelected
      ? 'var(--purple-500)'
      : state.isFocused
      ? 'var(--purple-500)'
      : 'transparent',
    ':active': {
      filter: 'brightness(0.8)',
    },
  }),
}

export function SellExchangeMobile({
  defaultExchanges,
  selectedExchanges,
  onSelectSellExchangeMobile,
}: SelectProps) {
  const handleExchangeSellChange = (
    newValue: OnChangeValue<exchangesType, true>
  ) => {
    onSelectSellExchangeMobile(newValue)
  }

  return (
    <Select
      value={defaultExchanges.filter((exchange) =>
        selectedExchanges.includes(exchange.value)
      )}
      options={defaultExchanges}
      isMulti
      instanceId={useId()}
      className={styles.select}
      components={{
        MultiValueContainer: multiValueContainer,
      }}
      placeholder={<div>Selecione uma Exchange</div>}
      formatGroupLabel={formatGroupLabel}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      styles={customStyles}
      isSearchable={false}
      onChange={handleExchangeSellChange}
    />
  )
}
