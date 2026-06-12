/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Info, TrendingUp, DollarSign, Percent, Scale, AlertTriangle } from 'lucide-react';

interface ContractSpec {
  name: string;
  ticker: string;
  standard: {
    contractSize: string;
    multiplier: number;
    tickSize: number;
    tickValue: number;
    initialMargin: number;
    maintenanceMargin: number;
    unit: string;
    typicalPrice: number;
    isMicroAvailable: boolean;
    format: (v: number) => string;
  };
  micro?: {
    name: string;
    ticker: string;
    contractSize: string;
    multiplier: number;
    tickSize: number;
    tickValue: number;
    initialMargin: number;
    maintenanceMargin: number;
    typicalPrice: number;
    format: (v: number) => string;
  };
}

const CONTRACTS: Record<string, ContractSpec> = {
  GC: {
    name: 'Oro',
    ticker: 'GC',
    standard: {
      contractSize: '100 oz troy',
      multiplier: 100,
      tickSize: 0.10,
      tickValue: 10.00,
      initialMargin: 42000,
      maintenanceMargin: 38000,
      unit: 'USD/oz',
      typicalPrice: 2426.0,
      isMicroAvailable: true,
      format: (v) => `$${v.toFixed(2)}`,
    },
    micro: {
      name: 'Oro Micro',
      ticker: 'MGC',
      contractSize: '10 oz troy',
      multiplier: 10,
      tickSize: 0.10,
      tickValue: 1.00,
      initialMargin: 1870,
      maintenanceMargin: 1700,
      typicalPrice: 2426.0,
      format: (v) => `$${v.toFixed(2)}`,
    }
  },
  NG: {
    name: 'Gas Natural',
    ticker: 'NG',
    standard: {
      contractSize: '10,000 MMBtu',
      multiplier: 10000,
      tickSize: 0.001,
      tickValue: 10.00,
      initialMargin: 4023,
      maintenanceMargin: 3658,
      unit: 'USD/MMBtu',
      typicalPrice: 3.66,
      isMicroAvailable: true,
      format: (v) => `$${v.toFixed(3)}`,
    },
    micro: {
      name: 'Gas Micro',
      ticker: 'MNG',
      contractSize: '1,000 MMBtu',
      multiplier: 1000,
      tickSize: 0.001,
      tickValue: 1.00,
      initialMargin: 341,
      maintenanceMargin: 310,
      typicalPrice: 3.66,
      format: (v) => `$${v.toFixed(3)}`,
    }
  },
  ZW: {
    name: 'Trigo',
    ticker: 'ZW',
    standard: {
      contractSize: '5,000 bushels',
      multiplier: 50, // Price in cents/bushel, so $ multiplier is 50
      tickSize: 0.25,
      tickValue: 12.50,
      initialMargin: 2000,
      maintenanceMargin: 1800,
      unit: 'cents/bushel',
      typicalPrice: 547.0,
      isMicroAvailable: true,
      format: (v) => `${v.toFixed(2)}¢`,
    },
    micro: {
      name: 'Trigo Mini',
      ticker: 'MZW',
      contractSize: '1,000 bushels',
      multiplier: 10, // Price in cents/bushel, so $ multiplier is 10
      tickSize: 0.25,
      tickValue: 2.50,
      initialMargin: 400,
      maintenanceMargin: 360,
      typicalPrice: 547.0,
      format: (v) => `${v.toFixed(2)}¢`,
    }
  },
  '6M': {
    name: 'USD/MXN Peso',
    ticker: '6M',
    standard: {
      contractSize: '500,000 MXN',
      multiplier: 500000,
      tickSize: 0.00001,
      tickValue: 5.00,
      initialMargin: 3200,
      maintenanceMargin: 2900,
      unit: 'USD/MXN (invertido)',
      typicalPrice: 0.05747,
      isMicroAvailable: false,
      format: (v) => v.toFixed(5),
    }
  },
  BTC: {
    name: 'Bitcoin',
    ticker: 'BTC',
    standard: {
      contractSize: '5 BTC',
      multiplier: 5,
      tickSize: 5.00,
      tickValue: 25.00,
      initialMargin: 140000,
      maintenanceMargin: 127000,
      unit: 'USD/BTC',
      typicalPrice: 74000.0,
      isMicroAvailable: true,
      format: (v) => `$${v.toLocaleString()}`,
    },
    micro: {
      name: 'Micro Bitcoin',
      ticker: 'MBT',
      contractSize: '0.1 BTC',
      multiplier: 0.1,
      tickSize: 5.00,
      tickValue: 0.50,
      initialMargin: 2800,
      maintenanceMargin: 2540,
      typicalPrice: 74000.0,
      format: (v) => `$${v.toLocaleString()}`,
    }
  },
  ES: {
    name: 'E-mini S&P 500',
    ticker: 'ES',
    standard: {
      contractSize: '$50 × Index',
      multiplier: 50,
      tickSize: 0.25,
      tickValue: 12.50,
      initialMargin: 12500,
      maintenanceMargin: 11400,
      unit: 'Index Points',
      typicalPrice: 5400.0,
      isMicroAvailable: true,
      format: (v) => `${v.toFixed(2)} pts`,
    },
    micro: {
      name: 'Micro E-mini S&P 500',
      ticker: 'MES',
      contractSize: '$5 × Index',
      multiplier: 5,
      tickSize: 0.25,
      tickValue: 1.25,
      initialMargin: 1250,
      maintenanceMargin: 1140,
      typicalPrice: 5400.0,
      format: (v) => `${v.toFixed(2)} pts`,
    }
  },
  NQ: {
    name: 'E-mini Nasdaq-100',
    ticker: 'NQ',
    standard: {
      contractSize: '$20 × Index',
      multiplier: 20,
      tickSize: 0.25,
      tickValue: 5.00,
      initialMargin: 18500,
      maintenanceMargin: 16800,
      unit: 'Index Points',
      typicalPrice: 19500.0,
      isMicroAvailable: true,
      format: (v) => `${v.toFixed(2)} pts`,
    },
    micro: {
      name: 'Micro E-mini Nasdaq-100',
      ticker: 'MNQ',
      contractSize: '$2 × Index',
      multiplier: 2,
      tickSize: 0.25,
      tickValue: 0.50,
      initialMargin: 1850,
      maintenanceMargin: 1680,
      typicalPrice: 19500.0,
      format: (v) => `${v.toFixed(2)} pts`,
    }
  }
};

export default function CmeCalculator() {
  const [selectedAsset, setSelectedAsset] = useState<string>('GC');
  const [isMicro, setIsMicro] = useState<boolean>(false);
  const [priceEntry, setPriceEntry] = useState<number>(2426.0);
  const [priceExit, setPriceExit] = useState<number>(2450.0);
  const [numContracts, setNumContracts] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1); // 1 = LONG, -1 = SHORT
  const [commission, setCommission] = useState<number>(25.0);
  const [depositedMargin, setDepositedMargin] = useState<number>(42000);
  
  const currentAsset = CONTRACTS[selectedAsset];
  const activeSpec = isMicro && currentAsset.micro ? currentAsset.micro : currentAsset.standard;
  const priceFormatter = activeSpec.format || ((v: number) => String(v));

  // Auto-populate defaults on asset or contract size change
  useEffect(() => {
    const spec = isMicro && currentAsset.micro ? currentAsset.micro : currentAsset.standard;
    setPriceEntry(spec.typicalPrice);
    setPriceExit(spec.typicalPrice * (direction === 1 ? 1.015 : 0.985));
    setDepositedMargin(spec.initialMargin);
  }, [selectedAsset, isMicro]);

  // Calculations
  const contractMultiplier = activeSpec.multiplier;
  const initialMarginRequired = numContracts * activeSpec.initialMargin;
  const maintenanceMarginRequired = numContracts * activeSpec.maintenanceMargin;
  const totalDepositedMargin = numContracts * depositedMargin;
  
  const notionalValue = priceEntry * contractMultiplier * numContracts;
  
  const differential = (priceExit - priceEntry) * direction;
  const pnlGross = differential * contractMultiplier * numContracts;
  const totalCommission = commission * numContracts;
  const pnlNet = pnlGross - totalCommission;
  
  const returnOnMargin = totalDepositedMargin > 0 ? (pnlNet / totalDepositedMargin) * 100 : 0;
  const implicitLeverage = totalDepositedMargin > 0 ? notionalValue / totalDepositedMargin : 0;
  
  // Margin call price calculation
  // PMC = Entrada + (Mantenimiento - Garantia_Unitaria) / (Direccion * Multiplicador)
  const marginCallPrice = priceEntry + (activeSpec.maintenanceMargin - depositedMargin) / (direction * contractMultiplier);
  
  // Margin status safety level
  const isLoss = pnlNet < 0;
  const unitLoss = differential * contractMultiplier;
  const unitEquity = depositedMargin + (unitLoss * direction); // Equity per contract
  
  let marginStatus: 'safe' | 'warning' | 'call' = 'safe';
  if (depositedMargin > 0) {
    if (unitEquity <= activeSpec.maintenanceMargin) {
      marginStatus = 'call';
    } else if (unitEquity <= activeSpec.maintenanceMargin + (activeSpec.initialMargin - activeSpec.maintenanceMargin) * 0.5) {
      marginStatus = 'warning';
    }
  }

  // Generate dynamic exit scenarios
  const generateScenarios = () => {
    const steps = [-0.05, -0.03, -0.015, -0.005, 0, 0.005, 0.015, 0.03, 0.05];
    return steps.map(pct => {
      const exitPrice = priceEntry * (1 + pct * direction);
      const diff = (exitPrice - priceEntry) * direction;
      const gross = diff * contractMultiplier;
      const net = gross - commission;
      const ret = (net / depositedMargin) * 100;
      return {
        exitPrice,
        pctChange: pct * 100,
        pnlPerContract: net,
        pnlTotal: net * numContracts,
        ret
      };
    });
  };

  const scenarios = generateScenarios();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left animate-fade-in">
      
      {/* LEFT COLUMN: PARAMETERS & SPECIFICATIONS */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Spec Card */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
            <h3 className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-400" /> Especificaciones del Contrato
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">CME Group 2026</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-normal">
            <div>
              <label className="text-slate-500 font-mono block">Activo</label>
              <select
                value={selectedAsset}
                onChange={(e) => {
                  setSelectedAsset(e.target.value);
                  setIsMicro(false);
                }}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 mt-1 focus:outline-none focus:border-teal-400 font-medium cursor-pointer"
              >
                {Object.keys(CONTRACTS).map(key => (
                  <option key={key} value={key}>
                    {CONTRACTS[key].name} ({key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 font-mono block">Tamaño Contrato</label>
              <span className="w-full inline-block bg-slate-950/30 border border-slate-850/50 rounded-xl px-3 py-2 text-slate-300 mt-1 font-mono font-medium">
                {activeSpec.contractSize}
              </span>
            </div>
          </div>

          {currentAsset.micro && (
            <div className="bg-slate-950/30 border border-slate-850/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Operar versión MICRO / MINI</span>
              <button
                onClick={() => setIsMicro(!isMicro)}
                className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold transition uppercase border cursor-pointer ${
                  isMicro 
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' 
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                }`}
              >
                {isMicro ? 'Activo (Micro)' : 'Inactivo (Std)'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-[11px] font-mono border-t border-slate-850/40 pt-3">
            <div className="bg-slate-950/20 p-2 rounded-xl text-center">
              <span className="text-slate-500 block text-[9px]">SÍMBOLO</span>
              <span className="text-slate-300 font-bold">
                {isMicro && currentAsset.micro ? currentAsset.micro.ticker : currentAsset.ticker}
              </span>
            </div>
            <div className="bg-slate-950/20 p-2 rounded-xl text-center">
              <span className="text-slate-500 block text-[9px]">TICK MÍN.</span>
              <span className="text-slate-300 font-bold">{activeSpec.tickSize}</span>
            </div>
            <div className="bg-slate-950/20 p-2 rounded-xl text-center">
              <span className="text-slate-500 block text-[9px]">VALOR TICK</span>
              <span className="text-teal-400 font-bold">${activeSpec.tickValue}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-slate-950/20 p-2 rounded-xl text-center">
              <span className="text-slate-500 block text-[9px]">MARGEN INICIAL</span>
              <span className="text-slate-300 font-bold">${activeSpec.initialMargin.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950/20 p-2 rounded-xl text-center">
              <span className="text-slate-500 block text-[9px]">MANTENIMIENTO</span>
              <span className="text-slate-300 font-bold">${activeSpec.maintenanceMargin.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Inputs Card */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
            <h3 className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" /> Parámetros del Trade
            </h3>
            <span className="text-[9px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-medium">Modificables</span>
          </div>

          <div className="space-y-4">
            {/* Direction Selection */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setDirection(1)}
                className={`py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  direction === 1
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-sm'
                    : 'bg-slate-950/30 border-slate-850 text-slate-500 hover:text-slate-400'
                }`}
              >
                LONG (Comprar)
              </button>
              <button
                onClick={() => setDirection(-1)}
                className={`py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  direction === -1
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-sm'
                    : 'bg-slate-950/30 border-slate-850 text-slate-500 hover:text-slate-400'
                }`}
              >
                SHORT (Vender)
              </button>
            </div>

            {/* Entry / Exit / Volume */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block">Precio de Entrada</label>
                <input
                  type="number"
                  step={activeSpec.tickSize}
                  value={priceEntry}
                  onChange={(e) => setPriceEntry(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 mt-1 focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block">Precio de Salida</label>
                <input
                  type="number"
                  step={activeSpec.tickSize}
                  value={priceExit}
                  onChange={(e) => setPriceExit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 mt-1 focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block">Contratos</label>
                <input
                  type="number"
                  min="1"
                  value={numContracts}
                  onChange={(e) => setNumContracts(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 mt-1 focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block">Comisión (USD por contr.)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={commission}
                  onChange={(e) => setCommission(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 mt-1 focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-400 font-medium">Margen Depositado (Garantía por contr.)</label>
                <span className="text-[10px] text-slate-500 font-mono">Requerido: ${activeSpec.initialMargin.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 items-center mt-1">
                <span className="text-slate-500 text-xs font-mono">$</span>
                <input
                  type="number"
                  min={activeSpec.initialMargin}
                  value={depositedMargin}
                  onChange={(e) => setDepositedMargin(Math.max(activeSpec.initialMargin, Number(e.target.value)))}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-400 font-mono text-sm font-semibold"
                />
              </div>
              <p className="text-[9.5px] text-slate-500 mt-1 leading-normal">
                Añadir un margen depositado superior al inicial reduce el apalancamiento implícito y aleja el precio de Margin Call.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: REAL-TIME RESULTS & SCENARIOS */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Dashboard Metrics */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
            <h3 className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> Resultados del Escenario
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Cálculo en tiempo real</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/20 border border-slate-850/40 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Valor Nocional</span>
              <div className="text-sm font-bold text-slate-250 font-mono mt-1">${notionalValue.toLocaleString()}</div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Exposición total</span>
            </div>

            <div className="bg-slate-950/20 border border-slate-850/40 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Garantía Total</span>
              <div className="text-sm font-bold text-slate-250 font-mono mt-1">${totalDepositedMargin.toLocaleString()}</div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Capital depositado</span>
            </div>

            <div className="bg-slate-950/20 border border-slate-850/40 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Apalancamiento</span>
              <div className="text-sm font-bold text-indigo-400 font-mono mt-1">{implicitLeverage.toFixed(1)}x</div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Notional / Garantía</span>
            </div>

            <div className="bg-slate-950/20 border border-slate-850/40 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Margen Requerido</span>
              <div className="text-sm font-bold text-slate-200 font-mono mt-1">${maintenanceMarginRequired.toLocaleString()}</div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Mantenimiento total</span>
            </div>
          </div>

          {/* PNL Block */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-400 to-indigo-500" />
            <div className="z-10 space-y-1">
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">P&L Neto Proyectado</span>
              <div className={`text-3xl font-extrabold font-mono tracking-tight ${pnlNet >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {pnlNet >= 0 ? '+' : ''}${pnlNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-450 font-normal">
                <span>P&L Bruto: ${pnlGross.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span>•</span>
                <span>Comisiones: ${totalCommission.toFixed(2)}</span>
              </div>
            </div>

            <div className="z-10 text-center sm:text-right shrink-0 bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl min-w-[140px] shadow-inner">
              <span className="text-[8.5px] text-slate-500 uppercase font-mono tracking-wider block">Retorno Proyectado</span>
              <div className={`text-xl font-bold font-mono mt-0.5 ${pnlNet >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {pnlNet >= 0 ? '+' : ''}{returnOnMargin.toFixed(2)}%
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Sobre garantía</span>
            </div>
          </div>

          {/* Margin Call / Liquidation Price details */}
          <div className={`p-4 rounded-xl border flex gap-3 ${
            marginStatus === 'call'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              : marginStatus === 'warning'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              : 'bg-teal-500/5 border-teal-500/15 text-teal-300'
          }`}>
            {marginStatus === 'call' || marginStatus === 'warning' ? (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-teal-400" />
            )}
            <div className="space-y-1.5 flex-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold uppercase tracking-wide text-[10.5px]">
                  {marginStatus === 'call' 
                    ? '⚠️ CRÍTICO: MARGIN CALL ALCANZADO' 
                    : marginStatus === 'warning'
                    ? '⚠️ ADVERTENCIA: CAPITAL PROXIMO A MANTENIMIENTO'
                    : '✓ Estado de Garantía Saludable'}
                </span>
                <span className="font-mono text-[10.5px] font-bold">
                  Precio Margin Call: {priceFormatter(marginCallPrice)}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400 font-normal">
                {marginStatus === 'call' 
                  ? 'El capital depositado neto ha caído por debajo del margen de mantenimiento. El broker liquidará forzosamente la posición si no se depositan fondos adicionales.' 
                  : marginStatus === 'warning'
                  ? 'El precio de salida proyectado causa pérdidas que reducen la garantía cerca del nivel de mantenimiento. Monitorear estrechamente.'
                  : `Tu posición tiene una cobertura holgada. El precio de liquidación teórica (Margin Call) es de ${priceFormatter(marginCallPrice)}, lo que requiere un movimiento adverso de ${Math.abs((marginCallPrice/priceEntry - 1)*100).toFixed(1)}% en el activo.`}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Scenario Grid */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono">
              Tabla de Escenarios de Salida Alternativos
            </h3>
            <p className="text-slate-500 text-[10.5px] font-normal">
              Simulación de variaciones porcentuales del activo a partir del precio de entrada ({priceFormatter(priceEntry)})
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-850/80 rounded-xl bg-slate-950/20">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 font-semibold text-[9.5px]">
                  <th className="py-2.5 px-3 text-left font-mono">PRECIO SALIDA</th>
                  <th className="py-2.5 px-3 text-center font-mono">VARIACIÓN ACTIVO</th>
                  <th className="py-2.5 px-3 text-right font-mono">P&L POR CONTRATO</th>
                  <th className="py-2.5 px-3 text-right font-mono">P&L TOTAL ({numContracts})</th>
                  <th className="py-2.5 px-3 text-right font-mono">RET. GARANTÍA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40">
                {scenarios.map((sc, i) => {
                  const isZero = sc.pctChange === 0;
                  const isPositive = sc.pnlTotal >= 0;
                  
                  const rowMarginCall = direction === 1 
                    ? sc.exitPrice <= marginCallPrice 
                    : sc.exitPrice >= marginCallPrice;
                  
                  return (
                    <tr 
                      key={i} 
                      className={`hover:bg-slate-900/35 transition ${
                        isZero 
                          ? 'bg-slate-900/50 text-slate-300 border-y border-slate-800' 
                          : rowMarginCall 
                          ? 'bg-rose-500/5 text-rose-300/90' 
                          : 'text-slate-450'
                      }`}
                    >
                      <td className={`py-2 px-3 text-left font-semibold ${isZero ? 'text-teal-400' : ''}`}>
                        {priceFormatter(sc.exitPrice)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {sc.pctChange === 0 ? '0.00% (Entrada)' : `${sc.pctChange > 0 ? '+' : ''}${sc.pctChange.toFixed(1)}%`}
                      </td>
                      <td className={`py-2 px-3 text-right font-semibold ${isZero ? 'text-slate-400' : isPositive ? 'text-teal-400/90' : 'text-rose-400/90'}`}>
                        {isZero ? '$0.00' : `${isPositive ? '+' : ''}$${sc.pnlPerContract.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${isZero ? 'text-slate-300' : isPositive ? 'text-teal-400' : 'text-rose-400'}`}>
                        {isZero ? '$0.00' : `${isPositive ? '+' : ''}$${sc.pnlTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      </td>
                      <td className={`py-2 px-3 text-right font-semibold ${isZero ? 'text-slate-500' : isPositive ? 'text-teal-400/90' : 'text-rose-400/90'}`}>
                        {isZero ? '0.0%' : `${isPositive ? '+' : ''}${sc.ret.toFixed(1)}%`}
                        {rowMarginCall && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded-sm ml-1.5 font-bold tracking-widest uppercase">CALL</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>
              Nota: El diferencial bruto incluye el tick sizing exacto del contrato CME. Los retornos netos consideran la comisión total de ${totalCommission.toFixed(2)}. Las filas marcadas con <span className="text-rose-400 font-bold">CALL</span> causarán la liquidación forzada si el precio actual llega a ese nivel.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
