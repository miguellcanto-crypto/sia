'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, ChevronDown, Clock } from 'lucide-react';
import {
    startOfDay,
    endOfDay,
    subDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
    format
} from 'date-fns';
import { es } from 'date-fns/locale';

interface DateRange {
    from: Date;
    to: Date;
}

interface DateRangePickerProps {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    className?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, className = '' }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer click afuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const setShortcut = (type: string) => {
        const today = new Date();
        let from = today;
        let to = today;

        switch (type) {
            case 'today':
                from = startOfDay(today);
                to = endOfDay(today);
                break;
            case 'yesterday':
                const yesterday = subDays(today, 1);
                from = startOfDay(yesterday);
                to = endOfDay(yesterday);
                break;
            case 'thisWeek':
                from = startOfWeek(today, { weekStartsOn: 1 });
                to = endOfWeek(today, { weekStartsOn: 1 });
                break;
            case 'last7days':
                from = startOfDay(subDays(today, 7));
                to = endOfDay(today);
                break;
            case 'thisMonth':
                from = startOfMonth(today);
                to = endOfMonth(today);
                break;
            case 'lastMonth':
                const lastMonth = subMonths(today, 1);
                from = startOfMonth(lastMonth);
                to = endOfMonth(lastMonth);
                break;
            case 'last30days':
                from = startOfDay(subDays(today, 30));
                to = endOfDay(today);
                break;
        }

        onDateRangeChange({ from, to });
        setIsOpen(false);
    };

    const handleCustomDate = (e: React.ChangeEvent<HTMLInputElement>, isFrom: boolean) => {
        const dateStr = e.target.value;
        if (!dateStr) return;
        
        const newDate = new Date(dateStr + 'T00:00:00'); // Evitar timezone issues con Date nativo
        if (isNaN(newDate.getTime())) return;

        if (isFrom) {
            onDateRangeChange({ from: startOfDay(newDate), to: dateRange.to });
        } else {
            onDateRangeChange({ from: dateRange.from, to: endOfDay(newDate) });
        }
    };

    const formatDisplay = () => {
        try {
            return `${format(dateRange.from, 'dd MMM yyyy', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`;
        } catch (e) {
            return 'Seleccionar Fecha';
        }
    };

    return (
        <div className={`relative ${className}`} ref={popoverRef}>
            <Button
                variant="outline"
                className="w-full sm:w-[280px] justify-between text-left font-normal bg-slate-900 border-slate-800 hover:bg-slate-800"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-200 text-sm">{formatDisplay()}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
            </Button>

            {isOpen && (
                <div className="absolute top-12 left-0 z-50 p-4 w-[320px] sm:w-[480px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col sm:flex-row gap-4">
                    {/* Atajos (Shortcuts) */}
                    <div className="flex-1 space-y-2 border-b sm:border-b-0 sm:border-r border-slate-800 pb-4 sm:pb-0 sm:pr-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Atajos Rápidos
                        </h4>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setShortcut('today')}>Hoy</Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setShortcut('yesterday')}>Ayer</Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setShortcut('thisWeek')}>Esta Semana</Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setShortcut('last7days')}>Últimos 7 días</Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setShortcut('thisMonth')}>Este Mes</Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setShortcut('lastMonth')}>Mes Anterior</Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setShortcut('last30days')}>Últimos 30 días</Button>
                    </div>

                    {/* Selector Manual */}
                    <div className="flex-1 space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Personalizado
                        </h4>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400">Desde</label>
                            <Input 
                                type="date" 
                                className="bg-slate-950 border-slate-800 text-slate-200"
                                value={format(dateRange.from, 'yyyy-MM-dd')}
                                onChange={(e) => handleCustomDate(e, true)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400">Hasta</label>
                            <Input 
                                type="date" 
                                className="bg-slate-950 border-slate-800 text-slate-200"
                                value={format(dateRange.to, 'yyyy-MM-dd')}
                                onChange={(e) => handleCustomDate(e, false)}
                            />
                        </div>
                        <div className="pt-4">
                            <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700" 
                                onClick={() => setIsOpen(false)}
                            >
                                Aplicar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
