// Exemplo de como usar a nova tabela Material-UI no arquivo futuros.tsx
// Substitua a seção de operações (linha ~1569) por:

import { FuturosTable } from "../components/FuturosOperationCard/FuturosTable";

// ... resto do código ...

// Em vez de:
/*
<div className={styles.operations}>
  {paginatedOperations.map((operation: any) => {
    // ... código antigo ...
  })}
</div>
*/

// Use:
<FuturosTable
  operations={paginatedOperations}
  viewConfig={viewConfig}
  dollarPrice={dollarPrice}
  isOpen={isOpen}
  isFavorite={(key: string) => favorites.includes(key)}
  onToggleFavorite={(key: string) => toggleFavorite(key)}
  onDeleteClick={(key: string) => setOperationToDelete(key)}
  onCalculatorClick={(operation: any) => handleCalculatorClick(operation)}
  onChartClick={(url: string) => {
    setTradingViewUrl(url);
    setIsTradingViewOpen(true);
  }}
  onClick={(operation: any) => setSelectedOperation(operation)}
/>;

// Isso substitui toda a lógica de renderização individual dos cards
// pela tabela Material-UI bonita e profissional
