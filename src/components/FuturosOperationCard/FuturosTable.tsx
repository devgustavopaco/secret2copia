import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  styled,
} from "@mui/material";
import { FuturosOperationCard } from "./index";
import { GlassTableContainer } from "../../components/glassTableContainer";

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: "transparent",
  borderRadius: "12px",
  overflow: "hidden",
  "&::-webkit-scrollbar": {
    height: "10px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: "10px",
  },
  "&::-webkit-scrollbar-thumb": {
    background:
      "linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(124, 58, 237, 0.6))",
    borderRadius: "10px",
    border: "2px solid rgba(255, 255, 255, 0.1)",
    "&:hover": {
      background:
        "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(124, 58, 237, 0.8))",
    },
  },
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
  "& .MuiTableCell-root": {
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: "rgba(59, 130, 246, 0.15)",
  backdropFilter: "blur(15px)",
  "& .MuiTableCell-head": {
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "0.95rem",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    borderBottom: "2px solid rgba(59, 130, 246, 0.4)",
    padding: "16px 8px",
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  color: "#ffffff",
  fontSize: "0.95rem",
  padding: "12px 8px",
  fontWeight: 600,
}));

interface FuturosTableProps {
  operations: any[];
  viewConfig: any;
  dollarPrice?: number;
  isOpen?: boolean;
  isFavorite: (key: string) => boolean;
  onToggleFavorite: (key: string) => void;
  onDeleteClick: (key: string) => void;
  onCalculatorClick: (operation: any) => void;
  onChartClick: (url: string) => void;
  onClick: (operation: any) => void;
}

export function FuturosTable({
  operations,
  viewConfig,
  dollarPrice,
  isOpen,
  isFavorite,
  onToggleFavorite,
  onDeleteClick,
  onCalculatorClick,
  onChartClick,
  onClick,
}: FuturosTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpansion = (ticker: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticker)) {
        newSet.delete(ticker);
      } else {
        newSet.add(ticker);
      }
      return newSet;
    });
  };
  return (
    <GlassTableContainer>
      <StyledTable aria-label="futuros operations table">
        <StyledTableHead>
          <TableRow>
            <StyledTableCell>Asset</StyledTableCell>
            <StyledTableCell>Spot</StyledTableCell>
            <StyledTableCell>Futuros</StyledTableCell>
            <StyledTableCell>Spreads</StyledTableCell>
            <StyledTableCell>Funding & Tempo</StyledTableCell>
            <StyledTableCell>Volumes</StyledTableCell>
            <StyledTableCell>Volumes 24h</StyledTableCell>
            <StyledTableCell>Ações</StyledTableCell>
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {operations.map((operation: any) => {
            const key = `${operation.ticker}-${operation.lowestAsk.exchange}-${operation.highestBid.exchange}`;
            const isExpanded = expandedGroups.has(operation.ticker);

            return (
              <React.Fragment key={key}>
                <FuturosOperationCard
                  coin={{
                    image: operation.coinImage,
                    name: operation.coin,
                    ask: operation.lowestAsk,
                    bid: operation.highestBid,
                    fee: operation.fee,
                    tax: operation.tax,
                    symbol: operation.ticker,
                    spread: operation.spread,
                    spreadS: operation.spreadS,
                    fundingRate: operation.fundingRate,
                    spotVolume24H: operation.spotVolume24h,
                    futVolume24H: operation.futVolume24h,
                    validSince: operation.validSince ?? 0,
                    fundingRateExpTs: operation.fundingRateExpTs,
                    tokenStats: operation.tokenStats,
                  }}
                  dollarPrice={dollarPrice}
                  isOpen={isOpen}
                  isFavorite={isFavorite(key)}
                  onToggleFavorite={() => onToggleFavorite(key)}
                  onDeleteClick={() => onDeleteClick(key)}
                  onCalculatorClick={() => onCalculatorClick(operation)}
                  onChartClick={onChartClick}
                  onClick={() => {
                    if (operation._isGroup && operation._groupedOps) {
                      toggleGroupExpansion(operation.ticker);
                    } else {
                      onClick(operation);
                    }
                  }}
                  viewConfig={viewConfig}
                  // Propriedades de grupo
                  isGroup={operation._isGroup || false}
                  groupCount={operation._groupCount || 0}
                  groupedOps={operation._groupedOps || []}
                  isExpanded={isExpanded}
                />

                {/* Renderizar operações expandidas do grupo */}
                {operation._isGroup &&
                  isExpanded &&
                  operation._groupedOps &&
                  operation._groupedOps
                    .slice(1)
                    .map((groupedOp: any, index: number) => {
                      const groupedKey = `${groupedOp.ticker}-${groupedOp.lowestAsk.exchange}-${groupedOp.highestBid.exchange}-${index}`;
                      return (
                        <FuturosOperationCard
                          key={groupedKey}
                          coin={{
                            image: groupedOp.coinImage,
                            name: groupedOp.coin,
                            ask: groupedOp.lowestAsk,
                            bid: groupedOp.highestBid,
                            fee: groupedOp.fee,
                            tax: groupedOp.tax,
                            symbol: groupedOp.ticker,
                            spread: groupedOp.spread,
                            spreadS: groupedOp.spreadS,
                            fundingRate: groupedOp.fundingRate,
                            spotVolume24H: groupedOp.spotVolume24h,
                            futVolume24H: groupedOp.futVolume24h,
                            validSince: groupedOp.validSince ?? 0,
                            fundingRateExpTs: groupedOp.fundingRateExpTs,
                            tokenStats: groupedOp.tokenStats,
                          }}
                          dollarPrice={dollarPrice}
                          isOpen={isOpen}
                          isFavorite={isFavorite(groupedKey)}
                          onToggleFavorite={() => onToggleFavorite(groupedKey)}
                          onDeleteClick={() => onDeleteClick(groupedKey)}
                          onCalculatorClick={() => onCalculatorClick(groupedOp)}
                          onChartClick={onChartClick}
                          onClick={() => onClick(groupedOp)}
                          viewConfig={viewConfig}
                          // Não é um grupo principal, é uma operação expandida
                          isGroup={false}
                          groupCount={0}
                          groupedOps={[]}
                        />
                      );
                    })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </StyledTable>
    </GlassTableContainer>
  );
}
