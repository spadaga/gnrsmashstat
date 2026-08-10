import { useEffect, useRef, useState } from 'react'
import { KeyRound, LogIn, ShieldCheck, X } from 'lucide-react'
import { getAdmins, verifyPin } from '../lib/admins'

/**
 * Admin login modal.
 * Step 1: pick your name from a grid of admin cards.
 * Step 2: enter your 4-digit PIN.
 * On success → calls onLogin(name).
 *
 * Props:
 *   open      boolean
 *   players   [{ name, pin? }]  — full players array from state
 *   onLogin   (name) => void
 *   onClose   () => void
 */
export default function LoginModal({ open, players, onLogin, onClose }) {
  const [step, setStep] = useState('pick')   // 'pick' | 'pin'
  const [selected, setSelected] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const pinRef = useRef(null)

  const admins = getAdmins(players || [])

  useEffect(() => {
    if (!open) { setStep('pick'); setSelected(''); setPin(''); setError('') }
  }, [open])

  useEffect(() => {
    if (step === 'pin') setTimeout(() => pinRef.current?.focus(), 50)
  }, [step])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function pickName(name) {
    setSelected(name)
    setPin('')
    setError('')
    setStep('pin')
  }

  function handlePinInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(val)
    setError('')
    if (val.length === 4) {
      if (verifyPin(players, selected, val)) {
        onLogin(selected)
      } else {
        setError('Incorrect PIN. Try again.')
        setPin('')
      }
    }
  }

  function handleLoginButton() {
    if (pin.length === 4 && verifyPin(players, selected, pin)) onLogin(selected)
    else setError('Incorrect PIN. Try again.')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
          <X size={18} />
        </button>

        {step === 'pick' ? (
          <>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-orange-600" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Admin Login</h3>
                <p className="text-xs text-slate-500">Select your name to continue</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {admins.map(({ name }) => (
                <button
                  key={name}
                  onClick={() => pickName(name)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-sm font-medium text-slate-700 transition group"
                >
                  <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:text-orange-600 transition shrink-0">
                    {name[0]}
                  </span>
                  {name}
                </button>
              ))}
              {admins.length === 0 && (
                <p className="col-span-2 text-center text-slate-400 text-sm py-4">No admins configured.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { setStep('pick'); setPin(''); setError('') }}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition text-xs flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="flex flex-col items-center text-center pt-4">
              <span className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <KeyRound size={24} className="text-orange-600" />
              </span>
              <h3 className="text-base font-bold text-slate-900">Welcome, {selected}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">Enter your 4-digit PIN</p>

              <div className="flex gap-3 mb-5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition ${
                      pin.length > i ? 'bg-orange-600 border-orange-600' : 'bg-white border-slate-300'
                    }`}
                  />
                ))}
              </div>

              <input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={handlePinInput}
                className="w-32 text-center border-2 rounded-xl px-3 py-2 text-lg font-bold tracking-widest focus:outline-none focus:border-orange-400"
                placeholder="••••"
              />

              {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}

              <button
                onClick={handleLoginButton}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition"
              >
                <LogIn size={16} /> Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
