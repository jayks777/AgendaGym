import { useState } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USER = {
  nome: "Jaykson Gostoso",
  matricula: "2025310052",
  curso: "Técnico em Informática",
  turma: "2º ADM",
};

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const FULL_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const SLOTS = [
  { id: "A", label: "11:30 – 12:30" },
  { id: "B", label: "12:30 – 13:30" },
];

const SPORTS = [
  { id: "volei",   label: "Vôlei",   icon: "🏐" },
  { id: "futsal",  label: "Futsal",  icon: "⚽" },
  { id: "frisbee", label: "Frisbee", icon: "🥏" },
  { id: "outros",  label: "Outros",  icon: "🏅" },
];

// status: "vago" | "confirmado" | "pendente" | "recusado" | "recorrente" | "indisponivel"
const INITIAL_SCHEDULE = {
  SEG: {
    A: { status: "vago" },
    B: { status: "recusado", turma: "2º ADM", motivo: "Conflito de horário" },
  },
  TER: {
    A: { status: "confirmado", turma: "2º INFO", responsavel: "Eduarda Ayala", professor: "Prof. Marcos" },
    B: { status: "pendente", turma: "2º INFO", responsavel: "Jaykson Silva" },
  },
  QUA: {
    A: { status: "vago" },
    B: { status: "vago" },
  },
  QUI: {
    A: { status: "recorrente", turma: "Vôlei", descricao: "Treino Semanal", professor: "Prof. Ana" },
    B: { status: "vago" },
  },
  SEX: {
    A: { status: "indisponivel", motivo: "Manutenção do ginásio" },
    B: { status: "indisponivel", motivo: "Manutenção do ginásio" },
  },
};

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  vago: {
    bg: "bg-[#1E2733] hover:bg-[#253040] border border-[#2D3A4A] hover:border-[#00D4A8]/40 cursor-pointer",
    label: "Disponível",
    labelColor: "text-[#4A5A6A]",
    icon: "＋",
    iconColor: "text-[#00D4A8]/50",
  },
  confirmado: {
    bg: "bg-[#0D3D2E] border border-[#00D4A8]/50",
    label: "Confirmado",
    labelColor: "text-[#00D4A8]",
    icon: "✓",
    iconColor: "text-[#00D4A8]",
  },
  pendente: {
    bg: "bg-[#3D2E0D] border border-[#F5A623]/50",
    label: "Aguard. aprovação",
    labelColor: "text-[#F5A623]",
    icon: "⏳",
    iconColor: "text-[#F5A623]",
  },
  recusado: {
    bg: "bg-[#3D0D0D] border border-[#E5534B]/50",
    label: "Recusado",
    labelColor: "text-[#E5534B]",
    icon: "✕",
    iconColor: "text-[#E5534B]",
  },
  recorrente: {
    bg: "bg-[#1E1040] border border-[#A78BFA]/50",
    label: "Recorrente",
    labelColor: "text-[#A78BFA]",
    icon: "↻",
    iconColor: "text-[#A78BFA]",
  },
  indisponivel: {
    bg: "bg-[#0D1117] border border-[#1E2733]",
    label: "Indisponível",
    labelColor: "text-[#2D3A4A]",
    icon: "⊘",
    iconColor: "text-[#2D3A4A]",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getWeekLabel(offset) {
  if (offset === 0) return "Semana Atual";
  if (offset === 1) return "Próxima Semana";
  if (offset === -1) return "Semana Passada";
  return offset > 0 ? `+${offset} semanas` : `${offset} semanas`;
}

function getDateRange(offset) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(monday)} – ${fmt(friday)}`;
}

function userHasBookingThisWeek(schedule, userTurma) {
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const cell = schedule[day]?.[slot.id];
      if (
        cell &&
        (cell.status === "confirmado" || cell.status === "pendente") &&
        cell.turma === userTurma
      )
        return true;
    }
  }
  return false;
}

// ─── Modal de Agendamento ──────────────────────────────────────────────────────
function BookingModal({ day, slot, onConfirm, onClose }) {
  const [selectedSport, setSelectedSport] = useState(null);
  const [outroDesc, setOutroDesc] = useState("");

  const canSubmit = selectedSport && (selectedSport !== "outros" || outroDesc.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#00D4A8]/15 flex items-center justify-center text-[#00D4A8] text-lg">
            📅
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Novo Agendamento</h3>
            <p className="text-[#6B7A8D] text-xs">Solicitar uso do ginásio</p>
          </div>
        </div>

        {/* Info do slot */}
        <div className="bg-[#0D1117] rounded-xl p-4 mb-5 space-y-2">
          <Row label="Dia" value={`${FULL_DAYS[DAYS.indexOf(day)]}-feira`} />
          <Row label="Horário" value={slot.label} />
          <Row label="Turma" value={MOCK_USER.turma} />
          <Row label="Responsável" value={MOCK_USER.nome} />
        </div>

        {/* Seleção de esporte */}
        <div className="mb-5">
          <p className="text-[#6B7A8D] text-xs font-semibold uppercase tracking-widest mb-3">
            Modalidade esportiva <span className="text-[#E5534B]">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SPORTS.map((sport) => {
              const isSelected = selectedSport === sport.id;
              return (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150
                    ${isSelected
                      ? "bg-[#00D4A8]/10 border-[#00D4A8]/60 shadow-[0_0_0_1px_rgba(0,212,168,0.3)]"
                      : "bg-[#0D1117] border-[#2D3A4A] hover:border-[#3D4A5A] hover:bg-[#1E2733]"
                    }`}
                >
                  <span className="text-base">{sport.icon}</span>
                  <span className={`text-sm font-medium ${isSelected ? "text-[#00D4A8]" : "text-[#8B9EB0]"}`}>
                    {sport.label}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-[#00D4A8] text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Campo "outros" */}
          {selectedSport === "outros" && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Descreva a atividade..."
                value={outroDesc}
                onChange={(e) => setOutroDesc(e.target.value)}
                maxLength={40}
                className="w-full bg-[#0D1117] border border-[#2D3A4A] focus:border-[#00D4A8]/60 outline-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3D4A5A] transition-colors"
              />
            </div>
          )}
        </div>

        {/* Aviso */}
        <p className="text-[#6B7A8D] text-xs mb-5 leading-relaxed">
          O agendamento ficará <span className="text-[#F5A623] font-medium">pendente</span> até aprovação do professor responsável. Confirmação em até 24h.
        </p>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#2D3A4A] text-[#6B7A8D] text-sm hover:bg-[#1E2733] transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => onConfirm({ sport: selectedSport, descricao: selectedSport === "outros" ? outroDesc : SPORTS.find(s => s.id === selectedSport)?.label })}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${canSubmit
                ? "bg-[#00D4A8] text-[#0D1117] hover:bg-[#00BF97]"
                : "bg-[#1E2733] text-[#3D4A5A] cursor-not-allowed"
              }`}
          >
            Solicitar
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#6B7A8D] text-xs">{label}</span>
      <span className="text-white text-xs font-medium">{value}</span>
    </div>
  );
}

// ─── Modal de Detalhes ─────────────────────────────────────────────────────────
function DetailModal({ cell, day, slot, onClose, onCancel }) {
  const cfg = STATUS_CONFIG[cell.status];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-base">Detalhes do Slot</h3>
          <button onClick={onClose} className="text-[#4A5A6A] hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className={`rounded-xl p-4 mb-4 ${cell.status === "confirmado" ? "bg-[#0D3D2E]" : cell.status === "pendente" ? "bg-[#3D2E0D]" : cell.status === "recusado" ? "bg-[#3D0D0D]" : "bg-[#1E1040]"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg ${cfg.iconColor}`}>{cfg.icon}</span>
            <span className={`text-sm font-semibold ${cfg.labelColor}`}>{cfg.label}</span>
          </div>
          <p className="text-white font-bold text-base">{cell.turma}</p>
          {cell.descricao && <p className="text-[#A78BFA]/70 text-xs mt-0.5">{cell.descricao}</p>}
        </div>

        <div className="bg-[#0D1117] rounded-xl p-4 mb-5 space-y-2">
          <Row label="Dia" value={`${FULL_DAYS[DAYS.indexOf(day)]}-feira`} />
          <Row label="Horário" value={slot.label} />
          {cell.responsavel && <Row label="Responsável" value={cell.responsavel} />}
          {cell.professor && <Row label="Professor" value={cell.professor} />}
          {cell.motivo && <Row label="Motivo da recusa" value={cell.motivo} />}
        </div>

        <div className="flex gap-3">
          {cell.status === "pendente" && cell.turma === MOCK_USER.turma && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[#E5534B]/40 text-[#E5534B] text-sm hover:bg-[#3D0D0D] transition-colors"
            >
              Cancelar pedido
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#1E2733] text-white text-sm hover:bg-[#253040] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cell do Slot ──────────────────────────────────────────────────────────────
function SlotCell({ cell, day, slot, canBook, onVacantClick, onOccupiedClick }) {
  const cfg = STATUS_CONFIG[cell.status];
  const isVago = cell.status === "vago";
  const isIndisponivel = cell.status === "indisponivel";
  const isClickable = isVago ? canBook : !isIndisponivel;

  const sportIcon = cell.sport ? SPORTS.find(s => s.id === cell.sport)?.icon : null;

  return (
    <button
      disabled={isVago && !canBook || isIndisponivel}
      onClick={() => {
        if (isVago && canBook) onVacantClick();
        else if (!isVago && !isIndisponivel) onOccupiedClick();
      }}
      className={`
        w-full rounded-xl p-3.5 text-left transition-all duration-200
        ${cfg.bg}
        ${(isVago && !canBook) || isIndisponivel ? "cursor-not-allowed" : ""}
        ${isVago && !canBook ? "opacity-40" : ""}
        ${isClickable ? "active:scale-[0.97]" : ""}
      `}
    >
      {isIndisponivel ? (
        /* ── Estilo indisponível: padrão hachurado sutil ── */
        <div className="flex flex-col items-center justify-center py-1 gap-1.5"
          style={{ backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.015) 4px, rgba(255,255,255,0.015) 8px)" }}>
          <span className="text-[#2D3A4A] text-lg">⊘</span>
          <span className="text-[#2D3A4A] text-[10px] font-semibold uppercase tracking-widest">Indisponível</span>
          {cell.motivo && (
            <span className="text-[#1E2733] text-[9px] text-center leading-tight">{cell.motivo}</span>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {isVago ? (
                <span className={`text-xs font-medium ${canBook ? "text-[#4A5A6A]" : "text-[#2D3A4A]"}`}>
                  {canBook ? "Disponível — clique para agendar" : "Disponível"}
                </span>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    {sportIcon && <span className="text-sm">{sportIcon}</span>}
                    <p className="text-white text-sm font-semibold leading-tight truncate">{cell.turma}</p>
                  </div>
                  {cell.descricao && (
                    <p className={`text-xs mt-0.5 ${cfg.labelColor} opacity-80 italic`}>{cell.descricao}</p>
                  )}
                  {cell.responsavel && (
                    <p className="text-[#6B7A8D] text-xs mt-0.5 truncate">{cell.responsavel}</p>
                  )}
                </>
              )}
            </div>
            <span className={`text-base shrink-0 mt-0.5 ${cfg.iconColor}`}>{cfg.icon}</span>
          </div>
          {!isVago && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.labelColor}`}>
                {cfg.label}
              </span>
            </div>
          )}
        </>
      )}
    </button>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function MyBookingBadge({ schedule }) {
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const cell = schedule[day]?.[slot.id];
      if (
        cell &&
        (cell.status === "confirmado" || cell.status === "pendente") &&
        cell.turma === MOCK_USER.turma
      ) {
        const cfg = STATUS_CONFIG[cell.status];
        return (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cell.status === "confirmado" ? "bg-[#0D3D2E] border-[#00D4A8]/30" : "bg-[#3D2E0D] border-[#F5A623]/30"}`}>
            <span className={`text-xs ${cfg.iconColor}`}>{cfg.icon}</span>
            <span className={`text-xs font-medium ${cfg.labelColor}`}>
              {FULL_DAYS[DAYS.indexOf(day)]} · {slot.label}
            </span>
          </div>
        );
      }
    }
  }
  return null;
}

// ─── Dashboard Principal ───────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [bookingModal, setBookingModal] = useState(null); // { day, slot }
  const [detailModal, setDetailModal] = useState(null);  // { day, slot, cell }
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const hasBooking = userHasBookingThisWeek(schedule, MOCK_USER.turma);

  const handleConfirmBooking = ({ sport, descricao }) => {
    const { day, slot } = bookingModal;
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot.id]: {
          status: "pendente",
          turma: MOCK_USER.turma,
          responsavel: MOCK_USER.nome,
          sport,
          descricao,
        },
      },
    }));
    setBookingModal(null);
    showToast("Solicitação enviada! Aguardando aprovação do professor.");
  };

  const handleCancelBooking = () => {
    const { day, slot } = detailModal;
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot.id]: { status: "vago" },
      },
    }));
    setDetailModal(null);
    showToast("Agendamento cancelado.", "warning");
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all
          ${toast.type === "warning"
            ? "bg-[#3D2E0D] border-[#F5A623]/40 text-[#F5A623]"
            : "bg-[#0D3D2E] border-[#00D4A8]/40 text-[#00D4A8]"}`}>
          <span>{toast.type === "warning" ? "⚠️" : "✓"}</span>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {bookingModal && (
        <BookingModal
          day={bookingModal.day}
          slot={bookingModal.slot}
          onConfirm={handleConfirmBooking}
          onClose={() => setBookingModal(null)}
        />
      )}
      {detailModal && (
        <DetailModal
          {...detailModal}
          onClose={() => setDetailModal(null)}
          onCancel={handleCancelBooking}
        />
      )}

      {/* Header */}
      <header className="bg-[#0D1117] border-b border-[#1E2733] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#00D4A8] text-xl"></span>
            <span className="font-bold text-white tracking-tight">AgendaGym</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#161B22] border border-[#2D3A4A] rounded-lg px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-[#00D4A8]/20 flex items-center justify-center text-[#00D4A8] text-[10px] font-bold">
                {MOCK_USER.nome.charAt(0)}
              </div>
              <span className="text-xs text-[#8B9EB0]">{MOCK_USER.matricula}</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-[#6B7A8D] hover:text-[#E5534B] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#3D0D0D]/50">
              <span>Sair</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* User info + booking status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Olá, {MOCK_USER.nome.split(" ")[0]} 👋
            </h1>
            <p className="text-[#6B7A8D] text-sm mt-0.5">{MOCK_USER.turma} · {MOCK_USER.curso}</p>
          </div>
          <MyBookingBadge schedule={schedule} />
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-5 bg-[#161B22] border border-[#2D3A4A] rounded-xl px-4 py-3">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="text-[#6B7A8D] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1E2733]"
          >
            ← Anterior
          </button>
          <div className="text-center">
            <p className="text-white text-sm font-semibold">{getWeekLabel(weekOffset)}</p>
            <p className="text-[#4A5A6A] text-xs mt-0.5">{getDateRange(weekOffset)}</p>
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="text-[#6B7A8D] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1E2733]"
          >
            Próxima →
          </button>
        </div>

        {/* Aviso: já tem agendamento */}
        {hasBooking && weekOffset === 0 && (
          <div className="flex items-start gap-3 bg-[#0D2A1F] border border-[#00D4A8]/20 rounded-xl px-4 py-3 mb-5 text-sm">
            <span className="text-[#00D4A8] mt-0.5">ℹ</span>
            <p className="text-[#6BCFB0]">
              Sua turma já tem um agendamento nesta semana. Apenas um agendamento por turma por semana é permitido.
            </p>
          </div>
        )}

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`text-xs ${cfg.iconColor}`}>{cfg.icon}</span>
              <span className={`text-xs ${key === "indisponivel" ? "text-[#3D4A5A]" : "text-[#6B7A8D]"}`}>{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Grade */}
        <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl overflow-hidden">
          {/* Header dos dias */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-[#1E2733]">
            <div className="p-3" />
            {DAYS.map((day, i) => (
              <div key={day} className="p-3 text-center border-l border-[#1E2733]">
                <p className="text-white text-xs font-bold tracking-widest">{day}</p>
                <p className="text-[#4A5A6A] text-[10px] mt-0.5">{FULL_DAYS[i].slice(0, 3)}</p>
              </div>
            ))}
          </div>

          {/* Linhas de slot */}
          {SLOTS.map((slot, si) => (
            <div key={slot.id} className={`grid grid-cols-[80px_repeat(5,1fr)] ${si < SLOTS.length - 1 ? "border-b border-[#1E2733]" : ""}`}>
              {/* Label do horário */}
              <div className="p-3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[#6B7A8D] text-[10px] font-medium leading-tight">
                    {slot.label.split(" – ").map((t, i) => (
                      <span key={i} className="block">{t}</span>
                    ))}
                  </p>
                </div>
              </div>

              {/* Células */}
              {DAYS.map((day) => {
                const cell = schedule[day]?.[slot.id] ?? { status: "vago" };
                const canBook = !hasBooking || cell.turma === MOCK_USER.turma;
                return (
                  <div key={day} className="p-2 border-l border-[#1E2733]">
                    <SlotCell
                      cell={cell}
                      day={day}
                      slot={slot}
                      canBook={cell.status === "vago" && !hasBooking}
                      onVacantClick={() => setBookingModal({ day, slot })}
                      onOccupiedClick={() => setDetailModal({ day, slot, cell })}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Info rodapé */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-[#161B22] border border-[#2D3A4A] rounded-xl px-4 py-3">
            <p className="text-[#4A5A6A] text-[10px] font-semibold uppercase tracking-widest mb-1">Regras</p>
            <p className="text-[#6B7A8D] text-xs leading-relaxed">
              Máximo de 1 agendamento por turma por semana · Aprovação obrigatória do professor · Cancelamentos até 30min antes
            </p>
          </div>
          <div className="bg-[#161B22] border border-[#2D3A4A] rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <p className="text-[#4A5A6A] text-[10px] font-semibold uppercase tracking-widest">Suporte</p>
              <p className="text-[#6B7A8D] text-xs">ginasio@escola.edu.br</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E2733] mt-10 py-5 text-center">
        <p className="text-[#2D3A4A] text-xs">© AgendaGym 2026 · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}