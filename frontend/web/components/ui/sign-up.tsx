"use client"

import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, createContext, Children } from "react";
// Importing class-variance-authority for the built-in button component
import { cva, type VariantProps } from "class-variance-authority";
// Importing icons from lucide-react
import { ArrowRight, Mail, Gem, Lock, Eye, EyeOff, ArrowLeft, X, AlertCircle, PartyPopper, Loader } from "lucide-react";
// Importing animation components from framer-motion
import { AnimatePresence, motion, useInView, Variants, Transition } from "framer-motion";
import { GlassButton } from "./glass-button";

// --- CONFETTI LOGIC ---
import type { ReactNode } from "react"
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti"
import confetti from "canvas-confetti"

type Api = { fire: (options?: ConfettiOptions) => void }
export type ConfettiRef = Api | null
const ConfettiContext = createContext<Api>({} as Api)

export const Confetti = forwardRef<ConfettiRef, React.ComponentPropsWithRef<"canvas"> & { options?: ConfettiOptions; globalOptions?: ConfettiGlobalOptions; manualstart?: boolean }>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)
  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) {
      if (instanceRef.current) return
      instanceRef.current = confetti.create(node, { ...globalOptions, resize: true })
    } else {
      if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    }
  }, [globalOptions])
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
  const api = useMemo(() => ({ fire }), [fire])
  useImperativeHandle(ref, () => api, [api])
  useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
  return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

// --- TEXT LOOP ANIMATION COMPONENT ---
type TextLoopProps = { children: React.ReactNode[]; className?: string; interval?: number; transition?: Transition; variants?: Variants; onIndexChange?: (index: number) => void; stopOnEnd?: boolean; };
export function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) {
          clearInterval(timer);
          return current;
        }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial='initial' animate='animate' exit='exit' transition={transition} variants={variants || motionVariants}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- BUILT-IN BLUR FADE ANIMATION COMPONENT ---
interface BlurFadeProps { children: React.ReactNode; className?: string; variant?: { hidden: { y: number }; visible: { y: number } }; duration?: number; delay?: number; yOffset?: number; inView?: boolean; inViewMargin?: string; blur?: string; }
export function BlurFade({ children, className, variant, duration = 0.4, delay = 0, yOffset = 6, inView = true, inViewMargin = "-50px", blur = "6px" }: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} exit="hidden" variants={combinedVariants} transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

// --- CHILD COMPONENTS ---
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6"> <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g></svg> );

const modalSteps = [
    { message: "Establishing connection...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
    { message: "Finalizing session...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
    { message: "Welcome Aboard!", icon: <PartyPopper className="w-12 h-12 text-green-500" /> }
];
const TEXT_LOOP_INTERVAL = 1.5;

const DefaultLogo = () => ( <div className="bg-primary text-primary-foreground rounded-md p-1.5"> <Gem className="h-4 w-4" /> </div> );

// --- MAIN COMPONENT ---
interface AuthComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
  onSuccess?: () => void;
  onGoogleClick?: () => void;
  onEmailSubmit?: (email: string, password?: string, mode?: 'login' | 'signup') => Promise<{ error?: string }>;
  isGoogleLoading?: boolean;
  isEmailLoading?: boolean;
}

export const AuthComponent = ({ 
  logo = <DefaultLogo />, 
  brandName = "Money OS", 
  onSuccess,
  onGoogleClick,
  onEmailSubmit,
  isGoogleLoading,
  isEmailLoading
}: AuthComponentProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authStep, setAuthStep] = useState("email");
  const [modalStatus, setModalStatus] = useState<'closed' | 'loading' | 'error' | 'success'>('closed');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const confettiRef = useRef<ConfettiRef>(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = confirmPassword.length >= 6;
  
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  
  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (fire) {
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const particleCount = 50;
        fire({ ...defaults, particleCount, origin: { x: 0, y: 1 }, angle: 60 });
        fire({ ...defaults, particleCount, origin: { x: 1, y: 1 }, angle: 120 });
    }
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mode === 'signup' && password !== confirmPassword) {
        setModalErrorMessage("Passwords do not match!");
        setModalStatus('error');
    } else {
        setModalStatus('loading');
        
        if (onEmailSubmit) {
          const { error } = await onEmailSubmit(email, password, mode);
          if (error) {
            setModalErrorMessage(error);
            setModalStatus('error');
            return;
          }
        }

        const loadingStepsCount = modalSteps.length - 1;
        const totalDuration = loadingStepsCount * TEXT_LOOP_INTERVAL * 1000;
        setTimeout(() => {
            fireSideCanons();
            setModalStatus('success');
            setTimeout(() => {
              if (onSuccess) onSuccess();
            }, 1500);
        }, totalDuration);
    }
  };

  const handleProgressStep = () => {
    if (authStep === 'email') {
        if (isEmailValid) setAuthStep("password");
    } else if (authStep === 'password') {
        if (isPasswordValid) {
            if (mode === 'signup') setAuthStep("confirmPassword");
            else handleFinalSubmit();
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleProgressStep();
    }
  };

  const handleGoBack = () => {
    if (authStep === 'confirmPassword') {
        setAuthStep('password');
        setConfirmPassword('');
    }
    else if (authStep === 'password') setAuthStep('email');
  };

  const closeModal = () => {
    setModalStatus('closed');
    setModalErrorMessage('');
  };

useEffect(() => {
    if (authStep === 'password') setTimeout(() => passwordInputRef.current?.focus(), 500);
    else if (authStep === 'confirmPassword') setTimeout(() => confirmPasswordInputRef.current?.focus(), 500);
}, [authStep]);

  const Modal = () => (
    <AnimatePresence>
        {modalStatus !== 'closed' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-card/80 border-4 border-border rounded-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4 mx-2">
                    {(modalStatus === 'error' || modalStatus === 'success') && <button onClick={closeModal} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>}
                    {modalStatus === 'error' && <>
                        <AlertCircle className="w-12 h-12 text-destructive" />
                        <p className="text-lg font-medium text-foreground">{modalErrorMessage}</p>
                        <GlassButton onClick={closeModal} size="sm" className="mt-4">Try Again</GlassButton>
                    </>}
                    {modalStatus === 'loading' && 
                        <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd={true}>
                            {modalSteps.slice(0, -1).map((step, i) => 
                                <div key={i} className="flex flex-col items-center gap-4">
                                    {step.icon}
                                    <p className="text-lg font-medium text-foreground">{step.message}</p>
                                </div>
                            )}
                        </TextLoop>
                    }
                    {modalStatus === 'success' &&
                        <div className="flex flex-col items-center gap-4">
                            {modalSteps[modalSteps.length - 1].icon}
                            <p className="text-lg font-medium text-foreground">{mode === 'login' ? 'Welcome Back!' : 'Welcome Aboard!'}</p>
                        </div>
                    }
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col relative overflow-hidden bg-transparent">
        <style>{`
            input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; } input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; } input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px transparent inset !important; -webkit-text-fill-color: var(--foreground) !important; background-color: transparent !important; background-clip: content-box !important; transition: background-color 5000s ease-in-out 0s !important; color: var(--foreground) !important; caret-color: var(--foreground) !important; } input:autofill { background-color: transparent !important; background-clip: content-box !important; -webkit-text-fill-color: var(--foreground) !important; color: var(--foreground) !important; } input:-internal-autofill-selected { background-color: transparent !important; background-image: none !important; color: var(--foreground) !important; -webkit-text-fill-color: var(--foreground) !important; } input:-webkit-autofill::first-line { color: var(--foreground) !important; -webkit-text-fill-color: var(--foreground) !important; }
            
            .glass-input-wrap {
                position: relative;
                z-index: 2;
                border-radius: 9999px;
                transition: transform 400ms cubic-bezier(0.25, 1, 0.5, 1);
            }

            .glass-input {
                display: flex;
                width: 100%;
                align-items: center;
                gap: 0.5rem;
                border-radius: 9999px;
                padding: 0.6rem 1.2rem;
                backdrop-filter: blur(24px) saturate(180%);
                background: rgba(255, 255, 255, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.35);
                box-shadow: 
                    0 8px 32px 0 rgba(0, 0, 0, 0.06),
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.7),
                    inset 0 -1px 2px 0 rgba(0, 0, 0, 0.05);
                transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
                position: relative;
                overflow: hidden;
            }

            .glass-input::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 50%;
                background: linear-gradient(
                    to bottom,
                    rgba(255, 255, 255, 0.45) 0%,
                    rgba(255, 255, 255, 0.1) 25%,
                    rgba(255, 255, 255, 0) 100%
                );
                pointer-events: none;
                z-index: 1;
            }

            .glass-input-wrap:focus-within .glass-input {
                background: rgba(255, 255, 255, 0.22);
                box-shadow: 
                    0 12px 40px 0 rgba(0, 0, 0, 0.08),
                    inset 0 1px 2px 0 rgba(255, 255, 255, 0.9);
                transform: scale(1.01) translateY(-1px);
            }
        `}</style>

        <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
        <Modal />

        <div className="flex w-full flex-1 h-full items-center justify-center pt-24 pb-48 relative z-10">
            <fieldset disabled={modalStatus !== 'closed'} className="flex flex-col items-center gap-8 w-[280px] mx-auto p-4">
                <AnimatePresence mode="wait">
                    {authStep === "email" && <motion.div key="email-content" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4">
                        <BlurFade delay={0.2} className="w-full"><div className="text-center"><p className="font-serif font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground whitespace-nowrap">{mode === 'login' ? 'Welcome Back' : 'Get started'}</p></div></BlurFade>
                        <BlurFade delay={0.3}><p className="text-sm font-medium text-muted-foreground">Continue with</p></BlurFade>
                        <BlurFade delay={0.4}><div className="flex items-center justify-center w-full">
                            <GlassButton 
                              contentClassName="flex items-center justify-center gap-2 w-full" 
                              size="default" 
                              className="w-[300px]"
                              onClick={onGoogleClick}
                              disabled={isGoogleLoading}
                            >
                              {isGoogleLoading ? <Loader className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                              <span className="font-semibold text-foreground">
                                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                              </span>
                            </GlassButton>
                        </div></BlurFade>
                        <BlurFade delay={0.5} className="w-[300px]"><div className="flex items-center w-full gap-2 py-2"><hr className="w-full border-border"/><span className="text-xs font-semibold text-muted-foreground">OR</span><hr className="w-full border-border"/></div></BlurFade>
                    </motion.div>}
                    {authStep === "password" && <motion.div key="password-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
                        <BlurFade delay={0} className="w-full"><div className="text-center"><p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground whitespace-nowrap">Password</p></div></BlurFade>
                        <BlurFade delay={0.2}><p className="text-sm font-medium text-muted-foreground">{mode === 'login' ? 'Enter your password to log in' : 'Set a secure password for your vault'}</p></BlurFade>
                    </motion.div>}
                    {authStep === "confirmPassword" && <motion.div key="confirm-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
                         <BlurFade delay={0} className="w-full"><div className="text-center"><p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground whitespace-nowrap">One Last Step</p></div></BlurFade>
                         <BlurFade delay={0.2}><p className="text-sm font-medium text-muted-foreground">Confirm your password to continue</p></BlurFade>
                    </motion.div>}
                </AnimatePresence>
                
                <form className="w-[300px] space-y-6">
                     <AnimatePresence>
                        {authStep !== 'confirmPassword' && <motion.div key="email-password-fields" exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full space-y-6">
                            <BlurFade delay={authStep === 'email' ? 0.6 : 0} inView={true} className="w-full">
                                <div className="relative w-full">
                                    <div className="glass-input-wrap w-full"><div className="glass-input">
                                        <div className={cn( "relative z-10 flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out w-10 pl-2" )}><Mail className="h-5 w-5 text-foreground/80 flex-shrink-0" /></div>
                                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} className={cn("relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 border-none outline-none focus:outline-none focus:ring-0")} />
                                        <div className={cn( "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isEmailValid && authStep === 'email' ? "w-10 pr-1" : "w-0" )}><GlassButton type="button" onClick={handleProgressStep} size="icon" contentClassName="text-foreground/80 hover:text-foreground"><ArrowRight className="w-5 h-5" /></GlassButton></div>
                                    </div></div>
                                </div>
                            </BlurFade>
                            <AnimatePresence>
                                {authStep === "password" && <BlurFade key="password-field" className="w-full">
                                    <div className="relative w-full">
                                        <div className="glass-input-wrap w-full"><div className="glass-input">
                                            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                                            </div>
                                            <input ref={passwordInputRef} type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 border-none outline-none focus:outline-none focus:ring-0" />
                                            <div className={cn( "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isPasswordValid ? "w-10 pr-1" : "w-0" )}><GlassButton type="button" onClick={handleProgressStep} size="icon" contentClassName="text-foreground/80 hover:text-foreground"><ArrowRight className="w-5 h-5" /></GlassButton></div>
                                        </div></div>
                                    </div>
                                    <BlurFade inView delay={0.2}><button type="button" onClick={handleGoBack} className="mt-4 flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /> Go back</button></BlurFade>
                                </BlurFade>}
                            </AnimatePresence>
                        </motion.div>}
                    </AnimatePresence>
                    <AnimatePresence>
                        {authStep === 'confirmPassword' && <BlurFade key="confirm-password-field" className="w-full">
                            <div className="relative w-full">
                                <div className="glass-input-wrap w-[300px]"><div className="glass-input">
                                    <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                                    </div>
                                    <input ref={confirmPasswordInputRef} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKeyDown} className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 border-none outline-none focus:outline-none focus:ring-0" />
                                    <div className={cn( "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isConfirmPasswordValid ? "w-10 pr-1" : "w-0" )}><GlassButton type="button" onClick={() => handleFinalSubmit()} size="icon" contentClassName="text-foreground/80 hover:text-foreground"><ArrowRight className="w-5 h-5" /></GlassButton></div>
                                </div></div>
                            </div>
                            <BlurFade inView delay={0.2}><button type="button" onClick={handleGoBack} className="mt-4 flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /> Go back</button></BlurFade>
                        </BlurFade>}
                    </AnimatePresence>
                </form>

                <BlurFade delay={0.8} inView className="mt-8">
                    <button 
                      type="button"
                      onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        setAuthStep('email');
                      }}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 border-b border-muted-foreground/30 hover:border-foreground"
                    >
                      {mode === 'login' ? "New here? Create an account" : "Already have an account? Log in"}
                    </button>
                </BlurFade>
            </fieldset>
        </div>
    </div>
  );
};
