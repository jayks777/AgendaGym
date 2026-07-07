import { useState } from "react";

// ─── Constantes ───────────────────────────────────────────────────────────────
const MOCK_TEACHER = { nome: "Prof. Marcos Oliveira", disciplina: "Ed. Física" };

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
const CURSOS = ["ALM", "INFO", "AGRO", "ADM"];
const TURMAS = ["1º ALM","2º ALM","1º INFO","2º INFO","1º AGRO","2º AGRO","1º ADM","2º ADM"];

const STATUS_CONFIG = {
  vago:        { bg:"bg-[#1E2733] hover:bg-[#253040] border border-[#2D3A4A] hover:border-[#00D4A8]/40", label:"Disponível",        labelColor:"text-[#4A5A6A]", icon:"＋", iconColor:"text-[#00D4A8]/50" },
  confirmado:  { bg:"bg-[#0D3D2E] border border-[#00D4A8]/50",  label:"Confirmado",        labelColor:"text-[#00D4A8]",  icon:"✓", iconColor:"text-[#00D4A8]" },
  pendente:    { bg:"bg-[#3D2E0D] border border-[#F5A623]/50",  label:"Aguard. aprovação", labelColor:"text-[#F5A623]",  icon:"⏳", iconColor:"text-[#F5A623]" },
  recusado:    { bg:"bg-[#3D0D0D] border border-[#E5534B]/50",  label:"Recusado",          labelColor:"text-[#E5534B]",  icon:"✕", iconColor:"text-[#E5534B]" },
  recorrente:  { bg:"bg-[#1E1040] border border-[#A78BFA]/50",  label:"Recorrente",        labelColor:"text-[#A78BFA]",  icon:"↻", iconColor:"text-[#A78BFA]" },
  indisponivel:{ bg:"bg-[#0D1117] border border-[#1E2733]",     label:"Indisponível",      labelColor:"text-[#2D3A4A]",  icon:"⊘", iconColor:"text-[#2D3A4A]" },
};

// ─── Mock Schedule ─────────────────────────────────────────────────────────────
const INITIAL_SCHEDULE = {
  SEG: { A:{ status:"vago" }, B:{ status:"recusado", turma:"2º ADM", motivo:"Conflito de horário", sport:"futsal" } },
  TER: { A:{ status:"confirmado", turma:"2º INFO", responsavel:"Eduarda Ayala", sport:"volei", descricao:"Vôlei" }, B:{ status:"pendente", turma:"2º INFO", responsavel:"Jaykson Silva", sport:"frisbee", descricao:"Frisbee" } },
  QUA: { A:{ status:"vago" }, B:{ status:"vago" } },
  QUI: { A:{ status:"recorrente", turma:"Atletismo", descricao:"Treino Semanal", sport:"outros" }, B:{ status:"vago" } },
  SEX: { A:{ status:"indisponivel", motivo:"Manutenção do ginásio" }, B:{ status:"indisponivel", motivo:"Manutenção do ginásio" } },
};

// ─── Mock Treinos Recorrentes ──────────────────────────────────────────────────
const INITIAL_RECORRENTES = [
  { id:1, turma:"Atletismo", dia:"QUI", slot:"A", sport:"outros", descricao:"Treino Semanal", ativo:true },
  { id:2, turma:"Vôlei Feminino", dia:"TER", slot:"B", sport:"volei", descricao:"Treino Inter-turmas", ativo:false },
];

// ─── Mock Relatórios ───────────────────────────────────────────────────────────
const RELATORIO_STATS = {
  totalSemana: 5, pendentes: 1, confirmados: 2, recusados: 1,
  porCurso: { ALM:3, INFO:8, AGRO:2, ADM:4 },
  porSport: { volei:6, futsal:4, frisbee:3, outros:4 },
  porDia: { SEG:2, TER:4, QUA:1, QUI:3, SEX:0 },
  historico: [
    { semana:"Jun 23–27", total:6, confirmados:4, recusados:2 },
    { semana:"Jun 30–Jul 4", total:8, confirmados:6, recusados:2 },
    { semana:"Jul 7–11",  total:5, confirmados:3, recusados:1 },
    { semana:"Jul 14–18", total:7, confirmados:5, recusados:2 },
  ],
  ultimasAtividades: [
    { tipo:"confirmado", turma:"2º INFO", sport:"Vôlei",   dia:"TER", hora:"08:14" },
    { tipo:"recusado",   turma:"2º ADM",  sport:"Futsal",  dia:"SEG", hora:"07:50" },
    { tipo:"pendente",   turma:"1º AGRO", sport:"Frisbee", dia:"QUA", hora:"07:22" },
    { tipo:"confirmado", turma:"1º ALM",  sport:"Futsal",  dia:"QUI", hora:"06:58" },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getWeekLabel(o) { return o===0?"Semana Atual":o===1?"Próxima Semana":o===-1?"Semana Passada":o>0?`+${o} semanas`:`${o} semanas`; }
function getDateRange(offset) {
  const now=new Date(), day=now.getDay(), monday=new Date(now);
  monday.setDate(now.getDate()-(day===0?6:day-1)+offset*7);
  const friday=new Date(monday); friday.setDate(monday.getDate()+4);
  const fmt=(d)=>d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
  return `${fmt(monday)} – ${fmt(friday)}`;
}
function sportIcon(id) { return SPORTS.find(s=>s.id===id)?.icon ?? "🏅"; }
function sportLabel(id) { return SPORTS.find(s=>s.id===id)?.label ?? "Outro"; }

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const styles = {
    success: "bg-[#0D3D2E] border-[#00D4A8]/40 text-[#00D4A8]",
    warning: "bg-[#3D2E0D] border-[#F5A623]/40 text-[#F5A623]",
    error:   "bg-[#3D0D0D] border-[#E5534B]/40 text-[#E5534B]",
  };
  const icons = { success:"✓", warning:"⚠", error:"✕" };
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${styles[toast.type||"success"]}`}>
      <span>{icons[toast.type||"success"]}</span>{toast.msg}
    </div>
  );
}

// ─── Shared Row ────────────────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#6B7A8D] text-xs">{label}</span>
      <span className="text-white text-xs font-medium">{value}</span>
    </div>
  );
}

// ─── Modal: Aprovar/Recusar ────────────────────────────────────────────────────
function ApprovalModal({ cell, day, slot, onApprove, onReject, onClose }) {
  const [motivo, setMotivo] = useState("");
  const [view, setView] = useState("main"); // "main" | "rejeitar"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 flex items-center justify-center text-xl">⏳</div>
            <div>
              <h3 className="text-white font-semibold text-base">Solicitação Pendente</h3>
              <p className="text-[#6B7A8D] text-xs">Aguardando sua decisão</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4A5A6A] hover:text-white text-lg">✕</button>
        </div>

        <div className="bg-[#0D1117] rounded-xl p-4 mb-4 space-y-2">
          <Row label="Turma" value={cell.turma} />
          <Row label="Responsável" value={cell.responsavel} />
          <Row label="Dia" value={`${FULL_DAYS[DAYS.indexOf(day)]}-feira`} />
          <Row label="Horário" value={slot.label} />
          <Row label="Modalidade" value={`${sportIcon(cell.sport)} ${sportLabel(cell.sport)}`} />
          {cell.descricao && <Row label="Descrição" value={cell.descricao} />}
        </div>

        {view === "main" ? (
          <div className="flex gap-3">
            <button onClick={() => setView("rejeitar")} className="flex-1 py-2.5 rounded-xl border border-[#E5534B]/40 text-[#E5534B] text-sm hover:bg-[#3D0D0D] transition-colors">
              ✕ Recusar
            </button>
            <button onClick={() => onApprove(day, slot)} className="flex-1 py-2.5 rounded-xl bg-[#00D4A8] text-[#0D1117] text-sm font-semibold hover:bg-[#00BF97] transition-colors">
              ✓ Aprovar
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[#6B7A8D] text-xs mb-2">Motivo da recusa <span className="text-[#E5534B]">*</span></p>
            <input
              type="text" value={motivo} onChange={e=>setMotivo(e.target.value)}
              placeholder="Ex: Ginásio reservado para evento..."
              className="w-full bg-[#0D1117] border border-[#2D3A4A] focus:border-[#E5534B]/60 outline-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3D4A5A] mb-3 transition-colors"
            />
            <div className="flex gap-3">
              <button onClick={() => setView("main")} className="flex-1 py-2.5 rounded-xl border border-[#2D3A4A] text-[#6B7A8D] text-sm hover:bg-[#1E2733] transition-colors">
                Voltar
              </button>
              <button disabled={!motivo.trim()} onClick={() => onReject(day, slot, motivo)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${motivo.trim()?"bg-[#E5534B] text-white hover:bg-[#d44840]":"bg-[#1E2733] text-[#3D4A5A] cursor-not-allowed"}`}>
                Confirmar recusa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Detalhe de slot (prof) ─────────────────────────────────────────────
function TeacherDetailModal({ cell, day, slot, onClose, onFree, onBlockToggle }) {
  const cfg = STATUS_CONFIG[cell.status];
  const isIndisponivel = cell.status === "indisponivel";
  const bgMap = { confirmado:"bg-[#0D3D2E]", pendente:"bg-[#3D2E0D]", recusado:"bg-[#3D0D0D]", recorrente:"bg-[#1E1040]", indisponivel:"bg-[#0D1117]" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-base">Detalhes do Slot</h3>
          <button onClick={onClose} className="text-[#4A5A6A] hover:text-white text-lg">✕</button>
        </div>
        <div className={`rounded-xl p-4 mb-4 ${bgMap[cell.status]||"bg-[#1E2733]"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg ${cfg.iconColor}`}>{cfg.icon}</span>
            <span className={`text-sm font-semibold ${cfg.labelColor}`}>{cfg.label}</span>
          </div>
          {cell.turma && <p className="text-white font-bold">{cell.turma}</p>}
          {cell.sport && <p className="text-[#6B7A8D] text-xs mt-0.5">{sportIcon(cell.sport)} {sportLabel(cell.sport)}</p>}
          {cell.descricao && <p className={`text-xs italic mt-0.5 ${cfg.labelColor} opacity-70`}>{cell.descricao}</p>}
        </div>
        <div className="bg-[#0D1117] rounded-xl p-4 mb-5 space-y-2">
          <Row label="Dia" value={`${FULL_DAYS[DAYS.indexOf(day)]}-feira`} />
          <Row label="Horário" value={slot.label} />
          {cell.responsavel && <Row label="Responsável" value={cell.responsavel} />}
          {cell.motivo && <Row label="Motivo" value={cell.motivo} />}
        </div>
        <div className="flex flex-col gap-2">
          {isIndisponivel ? (
            <button onClick={() => onBlockToggle(day, slot, false)} className="w-full py-2.5 rounded-xl bg-[#1E2733] border border-[#2D3A4A] text-[#6B7A8D] text-sm hover:bg-[#253040] hover:text-white transition-colors">
              ↩ Tornar disponível
            </button>
          ) : (
            <>
              {(cell.status === "confirmado" || cell.status === "recorrente") && (
                <button onClick={() => onFree(day, slot)} className="w-full py-2.5 rounded-xl border border-[#E5534B]/40 text-[#E5534B] text-sm hover:bg-[#3D0D0D] transition-colors">
                  Liberar horário
                </button>
              )}
              <button onClick={() => onBlockToggle(day, slot, true)} className="w-full py-2.5 rounded-xl border border-[#2D3A4A] text-[#6B7A8D] text-sm hover:bg-[#1E2733] transition-colors">
                ⊘ Marcar indisponível
              </button>
            </>
          )}
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#1E2733] text-white text-sm hover:bg-[#253040] transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Novo Treino Recorrente ─────────────────────────────────────────────
function RecurrentModal({ onConfirm, onClose }) {
  const [form, setForm] = useState({ turma:"", dia:"SEG", slot:"A", sport:"", descricao:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const canSave = form.turma && form.sport && (form.sport !== "outros" || form.descricao.trim());
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/15 flex items-center justify-center text-xl">↻</div>
          <div>
            <h3 className="text-white font-semibold text-base">Novo Treino Recorrente</h3>
            <p className="text-[#6B7A8D] text-xs">Repete toda semana automaticamente</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {/* Turma/grupo */}
          <div>
            <label className="text-[#6B7A8D] text-xs font-semibold uppercase tracking-widest block mb-1.5">
              Turma / Grupo <span className="text-[#E5534B]">*</span>
            </label>
            <input type="text" value={form.turma} onChange={e=>set("turma",e.target.value)} placeholder="Ex: Vôlei Feminino, Atletismo..."
              className="w-full bg-[#0D1117] border border-[#2D3A4A] focus:border-[#A78BFA]/60 outline-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3D4A5A] transition-colors" />
          </div>
          {/* Dia + Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#6B7A8D] text-xs font-semibold uppercase tracking-widest block mb-1.5">Dia</label>
              <select value={form.dia} onChange={e=>set("dia",e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2D3A4A] focus:border-[#A78BFA]/60 outline-none rounded-xl px-3 py-2.5 text-sm text-white transition-colors">
                {DAYS.map((d,i)=><option key={d} value={d}>{FULL_DAYS[i].slice(0,3)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[#6B7A8D] text-xs font-semibold uppercase tracking-widest block mb-1.5">Horário</label>
              <select value={form.slot} onChange={e=>set("slot",e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2D3A4A] focus:border-[#A78BFA]/60 outline-none rounded-xl px-3 py-2.5 text-sm text-white transition-colors">
                {SLOTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {/* Modalidade */}
          <div>
            <label className="text-[#6B7A8D] text-xs font-semibold uppercase tracking-widest block mb-1.5">
              Modalidade <span className="text-[#E5534B]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SPORTS.map(s=>{
                const sel = form.sport===s.id;
                return (
                  <button key={s.id} onClick={()=>set("sport",s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-all
                      ${sel?"bg-[#A78BFA]/10 border-[#A78BFA]/60 text-[#A78BFA]":"bg-[#0D1117] border-[#2D3A4A] text-[#8B9EB0] hover:border-[#3D4A5A]"}`}>
                    <span>{s.icon}</span><span className="font-medium">{s.label}</span>
                    {sel && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Descrição */}
          {form.sport === "outros" && (
            <input type="text" value={form.descricao} onChange={e=>set("descricao",e.target.value)}
              placeholder="Descreva a atividade..." maxLength={40}
              className="w-full bg-[#0D1117] border border-[#2D3A4A] focus:border-[#A78BFA]/60 outline-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3D4A5A] transition-colors" />
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#2D3A4A] text-[#6B7A8D] text-sm hover:bg-[#1E2733] transition-colors">Cancelar</button>
          <button disabled={!canSave} onClick={()=>onConfirm(form)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${canSave?"bg-[#A78BFA] text-[#0D1117] hover:bg-[#9370e8]":"bg-[#1E2733] text-[#3D4A5A] cursor-not-allowed"}`}>
            Salvar treino
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Bloquear Horário ────────────────────────────────────────────────────
function BlockModal({ day, slot, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#2D3A4A] flex items-center justify-center text-xl">⊘</div>
          <div>
            <h3 className="text-white font-semibold text-base">Bloquear Horário</h3>
            <p className="text-[#6B7A8D] text-xs">{FULL_DAYS[DAYS.indexOf(day)]}-feira · {slot.label}</p>
          </div>
        </div>
        <p className="text-[#6B7A8D] text-xs mb-3">Motivo (opcional)</p>
        <input type="text" value={motivo} onChange={e=>setMotivo(e.target.value)}
          placeholder="Ex: Evento escolar, manutenção..."
          className="w-full bg-[#0D1117] border border-[#2D3A4A] focus:border-[#6B7A8D] outline-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3D4A5A] mb-5 transition-colors" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#2D3A4A] text-[#6B7A8D] text-sm hover:bg-[#1E2733] transition-colors">Cancelar</button>
          <button onClick={()=>onConfirm(day, slot, motivo)} className="flex-1 py-2.5 rounded-xl bg-[#1E2733] border border-[#3D4A5A] text-white text-sm font-semibold hover:bg-[#253040] transition-colors">⊘ Bloquear</button>
        </div>
      </div>
    </div>
  );
}

// ─── Grade Cell (professor) ────────────────────────────────────────────────────
function TeacherSlotCell({ cell, onClick }) {
  const cfg = STATUS_CONFIG[cell.status];
  const isVago = cell.status === "vago";
  const isIndisponivel = cell.status === "indisponivel";
  return (
    <button onClick={onClick}
      className={`w-full rounded-xl p-3 text-left transition-all duration-150 active:scale-[0.97] ${cfg.bg}`}>
      {isIndisponivel ? (
        <div className="flex flex-col items-center justify-center py-1 gap-1"
          style={{backgroundImage:"repeating-linear-gradient(-45deg,transparent,transparent 4px,rgba(255,255,255,0.015) 4px,rgba(255,255,255,0.015) 8px)"}}>
          <span className="text-[#2D3A4A] text-base">⊘</span>
          <span className="text-[#2D3A4A] text-[10px] font-semibold uppercase tracking-widest">Indisponível</span>
          {cell.motivo && <span className="text-[#1E2733] text-[9px] text-center">{cell.motivo}</span>}
        </div>
      ) : isVago ? (
        <div className="flex items-center justify-between">
          <span className="text-[#4A5A6A] text-xs">Livre</span>
          <span className="text-[10px] text-[#2D3A4A] border border-[#2D3A4A] rounded px-1.5 py-0.5">+ ação</span>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              {cell.sport && <span className="text-sm">{sportIcon(cell.sport)}</span>}
              <p className="text-white text-xs font-semibold truncate mt-0.5">{cell.turma}</p>
              {cell.responsavel && <p className="text-[#6B7A8D] text-[10px] truncate">{cell.responsavel}</p>}
            </div>
            <span className={`text-sm shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>
          </div>
          {cell.status === "pendente" && (
            <div className="mt-1.5 pt-1.5 border-t border-[#F5A623]/20">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#F5A623]">Aguarda aprovação</span>
            </div>
          )}
        </>
      )}
    </button>
  );
}

// ─── Aba: Grade ────────────────────────────────────────────────────────────────
function TabGrade({ schedule, setSchedule, showToast }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [approvalModal, setApprovalModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [blockModal, setBlockModal] = useState(null);

  const pendentes = [];
  DAYS.forEach(d => SLOTS.forEach(s => {
    const c = schedule[d]?.[s.id];
    if (c?.status === "pendente") pendentes.push({ day:d, slot:s, cell:c });
  }));

  const handleApprove = (day, slot) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [slot.id]: { ...prev[day][slot.id], status:"confirmado" } } }));
    setApprovalModal(null);
    showToast("Agendamento aprovado!", "success");
  };
  const handleReject = (day, slot, motivo) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [slot.id]: { ...prev[day][slot.id], status:"recusado", motivo } } }));
    setApprovalModal(null);
    showToast("Agendamento recusado.", "warning");
  };
  const handleFree = (day, slot) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [slot.id]: { status:"vago" } } }));
    setDetailModal(null);
    showToast("Horário liberado.", "warning");
  };
  const handleBlockToggle = (day, slot, block) => {
    if (block) { setDetailModal(null); setBlockModal({ day, slot }); }
    else { setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [slot.id]: { status:"vago" } } })); setDetailModal(null); showToast("Horário disponibilizado.", "success"); }
  };
  const handleConfirmBlock = (day, slot, motivo) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [slot.id]: { status:"indisponivel", motivo: motivo||"Bloqueado pelo professor" } } }));
    setBlockModal(null);
    showToast("Horário bloqueado.", "warning");
  };

  const handleCellClick = (day, slot, cell) => {
    if (cell.status === "pendente") setApprovalModal({ day, slot, cell });
    else setDetailModal({ day, slot, cell });
  };

  return (
    <div>
      {approvalModal && <ApprovalModal {...approvalModal} onApprove={handleApprove} onReject={handleReject} onClose={()=>setApprovalModal(null)} />}
      {detailModal && <TeacherDetailModal {...detailModal} onClose={()=>setDetailModal(null)} onFree={handleFree} onBlockToggle={handleBlockToggle} />}
      {blockModal && <BlockModal {...blockModal} onConfirm={handleConfirmBlock} onClose={()=>setBlockModal(null)} />}

      {/* Pendentes banner */}
      {pendentes.length > 0 && (
        <div className="bg-[#3D2E0D] border border-[#F5A623]/30 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#F5A623]">⏳</span>
            <p className="text-[#F5A623] text-sm font-medium">
              {pendentes.length} solicitação{pendentes.length>1?"s":""} aguardando aprovação
            </p>
          </div>
          <button onClick={()=>setApprovalModal(pendentes[0])} className="text-xs bg-[#F5A623]/20 text-[#F5A623] px-3 py-1 rounded-lg hover:bg-[#F5A623]/30 transition-colors shrink-0">
            Revisar →
          </button>
        </div>
      )}

      {/* Week nav */}
      <div className="flex items-center justify-between mb-5 bg-[#161B22] border border-[#2D3A4A] rounded-xl px-4 py-3">
        <button onClick={()=>setWeekOffset(o=>o-1)} className="text-[#6B7A8D] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1E2733]">← Anterior</button>
        <div className="text-center">
          <p className="text-white text-sm font-semibold">{getWeekLabel(weekOffset)}</p>
          <p className="text-[#4A5A6A] text-xs mt-0.5">{getDateRange(weekOffset)}</p>
        </div>
        <button onClick={()=>setWeekOffset(o=>o+1)} className="text-[#6B7A8D] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1E2733]">Próxima →</button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
        {Object.entries(STATUS_CONFIG).map(([k,v])=>(
          <div key={k} className="flex items-center gap-1.5">
            <span className={`text-xs ${v.iconColor}`}>{v.icon}</span>
            <span className={`text-xs ${k==="indisponivel"?"text-[#3D4A5A]":"text-[#6B7A8D]"}`}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Grade */}
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[72px_repeat(5,1fr)] border-b border-[#1E2733]">
          <div className="p-3"/>
          {DAYS.map((d,i)=>(
            <div key={d} className="p-3 text-center border-l border-[#1E2733]">
              <p className="text-white text-xs font-bold tracking-widest">{d}</p>
              <p className="text-[#4A5A6A] text-[10px] mt-0.5">{FULL_DAYS[i].slice(0,3)}</p>
            </div>
          ))}
        </div>
        {SLOTS.map((slot,si)=>(
          <div key={slot.id} className={`grid grid-cols-[72px_repeat(5,1fr)] ${si<SLOTS.length-1?"border-b border-[#1E2733]":""}`}>
            <div className="p-3 flex items-center justify-center">
              <p className="text-[#6B7A8D] text-[10px] font-medium text-center leading-tight">
                {slot.label.split(" – ").map((t,i)=><span key={i} className="block">{t}</span>)}
              </p>
            </div>
            {DAYS.map(day=>{
              const cell = schedule[day]?.[slot.id] ?? { status:"vago" };
              return (
                <div key={day} className="p-2 border-l border-[#1E2733]">
                  <TeacherSlotCell cell={cell} onClick={()=>handleCellClick(day,slot,cell)} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aba: Treinos Recorrentes ──────────────────────────────────────────────────
function TabRecorrentes({ schedule, setSchedule, showToast }) {
  const [recorrentes, setRecorrentes] = useState(INITIAL_RECORRENTES);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAdd = (form) => {
    const novo = { id: Date.now(), turma:form.turma, dia:form.dia, slot:form.slot, sport:form.sport, descricao:form.descricao||sportLabel(form.sport), ativo:true };
    setRecorrentes(r=>[...r, novo]);
    // aplica na grade também
    setSchedule(prev=>({
      ...prev,
      [form.dia]: { ...prev[form.dia], [form.slot]: { status:"recorrente", turma:form.turma, sport:form.sport, descricao:form.descricao||sportLabel(form.sport) } }
    }));
    setShowModal(false);
    showToast("Treino recorrente criado!", "success");
  };

  const handleToggle = (id) => {
    setRecorrentes(r=>r.map(x=>x.id===id?{...x,ativo:!x.ativo}:x));
  };

  const handleDelete = (id) => {
    const t = recorrentes.find(x=>x.id===id);
    setRecorrentes(r=>r.filter(x=>x.id!==id));
    setSchedule(prev=>({
      ...prev,
      [t.dia]: { ...prev[t.dia], [t.slot]: { status:"vago" } }
    }));
    setConfirmDelete(null);
    showToast("Treino removido.", "warning");
  };

  return (
    <div>
      {showModal && <RecurrentModal onConfirm={handleAdd} onClose={()=>setShowModal(false)} />}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl text-center">
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="text-white font-semibold mb-2">Remover treino?</h3>
            <p className="text-[#6B7A8D] text-sm mb-5">Esta ação também liberará o slot na grade semanal.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-[#2D3A4A] text-[#6B7A8D] text-sm hover:bg-[#1E2733] transition-colors">Cancelar</button>
              <button onClick={()=>handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-[#E5534B] text-white text-sm font-semibold hover:bg-[#d44840] transition-colors">Remover</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-semibold text-base">Treinos Recorrentes</h2>
          <p className="text-[#6B7A8D] text-xs mt-0.5">Reservas que se repetem toda semana automaticamente</p>
        </div>
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 bg-[#A78BFA] text-[#0D1117] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#9370e8] transition-colors shrink-0">
          ↻ Novo treino
        </button>
      </div>

      {recorrentes.length === 0 ? (
        <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="text-white font-medium mb-1">Nenhum treino recorrente</p>
          <p className="text-[#6B7A8D] text-sm">Crie um para reservar automaticamente toda semana.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recorrentes.map(t=>(
            <div key={t.id} className={`bg-[#161B22] border rounded-2xl p-4 flex items-center gap-4 transition-all ${t.ativo?"border-[#A78BFA]/40":"border-[#2D3A4A] opacity-60"}`}>
              <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/10 flex items-center justify-center text-xl shrink-0">
                {sportIcon(t.sport)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{t.turma}</p>
                <p className="text-[#6B7A8D] text-xs mt-0.5">
                  {FULL_DAYS[DAYS.indexOf(t.dia)]}-feira · {SLOTS.find(s=>s.id===t.slot)?.label} · {sportLabel(t.sport)}
                </p>
                {t.descricao && <p className="text-[#A78BFA]/70 text-xs italic mt-0.5">{t.descricao}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle ativo */}
                <button onClick={()=>handleToggle(t.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${t.ativo?"bg-[#A78BFA]":"bg-[#2D3A4A]"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${t.ativo?"left-5":"left-0.5"}`}/>
                </button>
                <button onClick={()=>setConfirmDelete(t.id)} className="text-[#3D4A5A] hover:text-[#E5534B] text-base transition-colors p-1">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-5 bg-[#161B22] border border-[#2D3A4A] rounded-xl px-4 py-3">
        <p className="text-[#4A5A6A] text-[10px] font-semibold uppercase tracking-widest mb-1">Como funciona</p>
        <p className="text-[#6B7A8D] text-xs leading-relaxed">
          Treinos recorrentes reservam o slot automaticamente toda semana. Desative o toggle para pausar sem remover. Conflitos com agendamentos pendentes serão sinalizados.
        </p>
      </div>
    </div>
  );
}

// ─── Aba: Relatórios ───────────────────────────────────────────────────────────
function TabRelatorios() {
  const [filtro, setFiltro] = useState("todos");
  const s = RELATORIO_STATS;
  const maxDia = Math.max(...Object.values(s.porDia));
  const maxCurso = Math.max(...Object.values(s.porCurso));
  const maxSport = Math.max(...Object.values(s.porSport));
  const totalSport = Object.values(s.porSport).reduce((a,b)=>a+b,0);

  const statusBadge = (tipo) => {
    const map = { confirmado:"bg-[#0D3D2E] text-[#00D4A8]", recusado:"bg-[#3D0D0D] text-[#E5534B]", pendente:"bg-[#3D2E0D] text-[#F5A623]" };
    const icons = { confirmado:"✓", recusado:"✕", pendente:"⏳" };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[tipo]}`}>{icons[tipo]} {tipo.charAt(0).toUpperCase()+tipo.slice(1)}</span>;
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Esta semana",   value:s.totalSemana,  color:"text-white",       bg:"bg-[#161B22]" },
          { label:"Confirmados",   value:s.confirmados,  color:"text-[#00D4A8]",   bg:"bg-[#0D3D2E]" },
          { label:"Pendentes",     value:s.pendentes,    color:"text-[#F5A623]",   bg:"bg-[#3D2E0D]" },
          { label:"Recusados",     value:s.recusados,    color:"text-[#E5534B]",   bg:"bg-[#3D0D0D]" },
        ].map(k=>(
          <div key={k.label} className={`${k.bg} border border-[#2D3A4A] rounded-2xl px-4 py-4`}>
            <p className="text-[#6B7A8D] text-xs mb-1">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Agendamentos por dia */}
        <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-4">Agendamentos por dia</p>
          <div className="space-y-2.5">
            {DAYS.map((d,i)=>{
              const v = s.porDia[d];
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="text-[#6B7A8D] text-xs w-8 shrink-0">{FULL_DAYS[i].slice(0,3)}</span>
                  <div className="flex-1 bg-[#0D1117] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[#00D4A8] rounded-full transition-all" style={{width:`${maxDia?v/maxDia*100:0}%`}}/>
                  </div>
                  <span className="text-white text-xs font-bold w-4 text-right">{v}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por modalidade */}
        <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-4">Modalidades mais agendadas</p>
          <div className="space-y-2.5">
            {SPORTS.map(sp=>{
              const v = s.porSport[sp.id]||0;
              const pct = totalSport ? Math.round(v/totalSport*100) : 0;
              return (
                <div key={sp.id} className="flex items-center gap-3">
                  <span className="text-base w-6 shrink-0">{sp.icon}</span>
                  <div className="flex-1 bg-[#0D1117] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[#A78BFA] rounded-full transition-all" style={{width:`${maxSport?v/maxSport*100:0}%`}}/>
                  </div>
                  <span className="text-[#6B7A8D] text-xs w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por curso */}
        <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-4">Agendamentos por curso</p>
          <div className="space-y-2.5">
            {CURSOS.map(c=>{
              const v = s.porCurso[c]||0;
              return (
                <div key={c} className="flex items-center gap-3">
                  <span className="text-[#6B7A8D] text-xs w-10 shrink-0 font-semibold">{c}</span>
                  <div className="flex-1 bg-[#0D1117] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[#F5A623] rounded-full transition-all" style={{width:`${maxCurso?v/maxCurso*100:0}%`}}/>
                  </div>
                  <span className="text-white text-xs font-bold w-4 text-right">{v}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Histórico semanal */}
        <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-4">Histórico semanal</p>
          <div className="space-y-2">
            {s.historico.map((h,i)=>(
              <div key={i} className="flex items-center gap-3 bg-[#0D1117] rounded-xl px-3 py-2">
                <span className="text-[#6B7A8D] text-xs flex-1">{h.semana}</span>
                <span className="text-[#00D4A8] text-xs font-bold">{h.confirmados}✓</span>
                <span className="text-[#E5534B] text-xs font-bold">{h.recusados}✕</span>
                <span className="text-white text-xs font-semibold">{h.total} total</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas atividades */}
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-4">
        <p className="text-white text-sm font-semibold mb-4">Últimas atividades</p>
        <div className="space-y-2">
          {s.ultimasAtividades.map((a,i)=>(
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1E2733] last:border-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0
                ${a.tipo==="confirmado"?"bg-[#0D3D2E]":a.tipo==="recusado"?"bg-[#3D0D0D]":"bg-[#3D2E0D]"}`}>
                {a.tipo==="confirmado"?"✓":a.tipo==="recusado"?"✕":"⏳"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium">{a.turma} · {a.sport}</p>
                <p className="text-[#6B7A8D] text-[10px]">{FULL_DAYS[DAYS.indexOf(a.dia)]}-feira</p>
              </div>
              <div className="text-right shrink-0">
                {statusBadge(a.tipo)}
                <p className="text-[#4A5A6A] text-[10px] mt-0.5">{a.hora}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Taxa de aprovação */}
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-2xl p-4 flex items-center gap-5">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1E2733" strokeWidth="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#00D4A8" strokeWidth="3"
              strokeDasharray={`${(s.confirmados/(s.confirmados+s.recusados))*100} 100`}
              strokeLinecap="round"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {Math.round(s.confirmados/(s.confirmados+s.recusados)*100)}%
          </span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Taxa de aprovação</p>
          <p className="text-[#6B7A8D] text-xs mt-0.5">
            {s.confirmados} aprovados · {s.recusados} recusados · {s.pendentes} pendente{s.pendentes>1?"s":""}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Principal ───────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const [tab, setTab] = useState("grade");
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3200);
  };

  // count pendentes para badge
  const pendentesCount = DAYS.reduce((acc,d)=>acc+SLOTS.filter(s=>schedule[d]?.[s.id]?.status==="pendente").length, 0);

  const TABS = [
    { id:"grade",       label:"Grade",       icon:"📅", badge: pendentesCount||null },
    { id:"recorrentes", label:"Recorrentes", icon:"↻",  badge: null },
    { id:"relatorios",  label:"Relatórios",  icon:"📊", badge: null },
  ];

  return (
    <div className="min-h-screen bg-[#0D1117] text-white" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
      <Toast toast={toast} />

      {/* Header */}
      <header className="bg-[#0D1117] border-b border-[#1E2733] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#00D4A8] text-xl">🏋️</span>
            <span className="font-bold text-white tracking-tight">AgendaGym</span>
            <span className="hidden sm:inline text-[10px] font-semibold bg-[#A78BFA]/20 text-[#A78BFA] px-2 py-0.5 rounded-full ml-1">Professor</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#161B22] border border-[#2D3A4A] rounded-lg px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] text-[10px] font-bold">
                {MOCK_TEACHER.nome.split(" ").pop().charAt(0)}
              </div>
              <span className="text-xs text-[#8B9EB0]">{MOCK_TEACHER.nome}</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-[#6B7A8D] hover:text-[#E5534B] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#3D0D0D]/50">
              Sair →
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Painel do Professor 👨‍🏫</h1>
          <p className="text-[#6B7A8D] text-sm mt-0.5">{MOCK_TEACHER.nome} · {MOCK_TEACHER.disciplina}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#161B22] border border-[#2D3A4A] rounded-xl p-1 mb-6">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all relative
                ${tab===t.id?"bg-[#0D1117] text-white shadow-sm":"text-[#6B7A8D] hover:text-white hover:bg-[#1E2733]"}`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#F5A623] text-[#0D1117] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "grade"       && <TabGrade schedule={schedule} setSchedule={setSchedule} showToast={showToast} />}
        {tab === "recorrentes" && <TabRecorrentes schedule={schedule} setSchedule={setSchedule} showToast={showToast} />}
        {tab === "relatorios"  && <TabRelatorios />}
      </main>

      <footer className="border-t border-[#1E2733] mt-10 py-5 text-center">
        <p className="text-[#2D3A4A] text-xs">© AgendaGym 2026 · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}