"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Zap, BarChart3, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BreakList from '@/components/BreakList';
import BreakForm from '@/components/BreakForm';
import WelcomeScreen from '@/components/WelcomeScreen';
import HelpGuide from '@/components/HelpGuide';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const welcomeShown = sessionStorage.getItem('welcomeShown');
    if (!welcomeShown) {
      setShowWelcome(true);
    }
  }, []);

  const handleOpenFormForNew = () => {
    setEditingBreakId(null);
    setIsFormOpen(true);
  };

  const handleOpenFormForEdit = (id: string) => {
    setEditingBreakId(id);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBreakId(null);
  };

  const handleWelcomeContinue = () => {
    sessionStorage.setItem('welcomeShown', 'true');
    setShowWelcome(false);
  };

  if (!hasMounted) {
    return null;
  }

  if (showWelcome) {
    return <WelcomeScreen onContinue={handleWelcomeContinue} />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <main className="container mx-auto p-4 sm:p-6 md:p-8 flex-grow">
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl font-bold font-headline text-foreground">
                ActivaYA
              </h1>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Ayuda" onClick={() => setIsHelpOpen(true)}>
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ayuda</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/stats" passHref>
                    <Button variant="outline" size="icon" aria-label="Ver estadísticas">
                      <BarChart3 className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver estadísticas</p>
                </TooltipContent>
              </Tooltip>
              <Button onClick={handleOpenFormForNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-5 w-5" />
                Crear Pausa Activa
              </Button>
            </div>
          </header>

          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gestiona tus pausas activas para mantenerte saludable y productivo durante tu jornada. ¡Tu cuerpo te lo agradecerá!
          </p>
          
          <BreakList onEdit={handleOpenFormForEdit} />

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingBreakId ? 'Editar Pausa Activa' : 'Crear Nueva Pausa Activa'}</DialogTitle>
                <DialogDescription>
                  {editingBreakId ? 'Modifica los detalles de tu pausa.' : 'Completa los detalles para programar una nueva pausa.'}
                </DialogDescription>
              </DialogHeader>
              <BreakForm breakId={editingBreakId} onFinished={handleCloseForm} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Guía Rápida</DialogTitle>
                <DialogDescription>
                  Aprende a usar las funciones principales de ActivaYA.
                </DialogDescription>
              </DialogHeader>
              <HelpGuide />
            </DialogContent>
          </Dialog>

        </main>
        <footer className="text-center p-4 text-muted-foreground text-sm">
          © 2025 ActivaYA. 
		  <Link href="https://raw.githubusercontent.com/KilianDiaz/ActivaYa/refs/heads/main/manual_de_usuario.pdf" className="underline hover:text-primary ml-2">
		  Manual de usuario
		  </Link>
        </footer>
      </div>
    </TooltipProvider>
  );
}
