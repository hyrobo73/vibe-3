import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../shared/api/client";
import type { Schedule, TeamMember } from "../../shared/types/api";

type ViewMode = "week" | "month";
type MemberForm = {
  name: string;
  department: string;
  position: string;
  email: string;
};
type ScheduleForm = {
  member_id: string;
  type: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  memo: string;
};

const scheduleTypes = ["근무", "휴가", "출장", "교육", "기타"];
const emptyMemberForm: MemberForm = { name: "", department: "", position: "", email: "" };
const emptyScheduleForm: ScheduleForm = {
  member_id: "",
  type: "근무",
  title: "",
  starts_at: "",
  ends_at: "",
  location: "",
  memo: "",
};

export function SchedulePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => toDateInputValue(new Date()));
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(emptyScheduleForm);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const range = useMemo(() => (viewMode === "week" ? getWeekRange(anchorDate) : getMonthRange(anchorDate)), [anchorDate, viewMode]);
  const calendarDays = useMemo(() => getCalendarDays(anchorDate), [anchorDate]);

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [range.start, range.end, selectedMemberId]);

  async function loadMembers() {
    try {
      const result = await apiGet<TeamMember[]>("/api/team-members");
      setMembers(result);
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "팀원 목록을 불러오지 못했습니다.");
    }
  }

  async function loadSchedules() {
    try {
      const params = new URLSearchParams({ start_date: range.start, end_date: range.end });
      if (selectedMemberId) {
        params.set("member_id", selectedMemberId);
      }
      const result = await apiGet<Schedule[]>(`/api/schedules?${params.toString()}`);
      setSchedules(result);
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "일정 목록을 불러오지 못했습니다.");
    }
  }

  async function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = cleanPayload(memberForm);
    try {
      if (editingMemberId) {
        await apiPatch<TeamMember>(`/api/team-members/${editingMemberId}`, payload);
        setMessage("팀원 정보를 수정했습니다.");
      } else {
        await apiPost<TeamMember>("/api/team-members", payload);
        setMessage("팀원을 등록했습니다.");
      }
      setMemberForm(emptyMemberForm);
      setEditingMemberId(null);
      await loadMembers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "팀원 저장에 실패했습니다.");
    }
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...cleanPayload(scheduleForm),
      member_id: Number(scheduleForm.member_id),
    };

    try {
      if (editingScheduleId) {
        await apiPatch<Schedule>(`/api/schedules/${editingScheduleId}`, payload);
        setMessage("일정을 수정했습니다.");
      } else {
        await apiPost<Schedule>("/api/schedules", payload);
        setMessage("일정을 등록했습니다.");
      }
      setScheduleForm(emptyScheduleForm);
      setEditingScheduleId(null);
      await loadSchedules();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "일정 저장에 실패했습니다.");
    }
  }

  function startEditMember(member: TeamMember) {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      department: member.department,
      position: member.position ?? "",
      email: member.email ?? "",
    });
  }

  function startEditSchedule(schedule: Schedule) {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      member_id: String(schedule.member_id ?? ""),
      type: schedule.type,
      title: schedule.title,
      starts_at: toDatetimeLocalValue(schedule.starts_at),
      ends_at: toDatetimeLocalValue(schedule.ends_at),
      location: schedule.location ?? "",
      memo: schedule.memo ?? "",
    });
  }

  async function deleteMember(memberId: number) {
    try {
      await apiDelete<{ status: string }>(`/api/team-members/${memberId}`);
      setMessage("팀원을 삭제했습니다. 기존 일정은 유지됩니다.");
      if (selectedMemberId === String(memberId)) {
        setSelectedMemberId("");
      }
      await loadMembers();
      await loadSchedules();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "팀원 삭제에 실패했습니다.");
    }
  }

  async function deleteSchedule(scheduleId: number) {
    try {
      await apiDelete<{ status: string }>(`/api/schedules/${scheduleId}`);
      setMessage("일정을 삭제했습니다.");
      await loadSchedules();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "일정 삭제에 실패했습니다.");
    }
  }

  function moveRange(direction: -1 | 1) {
    const current = parseDate(anchorDate);
    if (viewMode === "week") {
      current.setDate(current.getDate() + direction * 7);
    } else {
      current.setMonth(current.getMonth() + direction);
    }
    setAnchorDate(toDateInputValue(current));
  }

  return (
    <section className="schedule-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">Team Schedule</p>
          <h2>팀원 일정 관리</h2>
        </div>
        <div className="view-actions">
          <button className={viewMode === "week" ? "active" : ""} type="button" onClick={() => setViewMode("week")}>주간</button>
          <button className={viewMode === "month" ? "active" : ""} type="button" onClick={() => setViewMode("month")}>월간</button>
        </div>
      </div>

      {(message || error) && <div className={error ? "notice error" : "notice"}>{error || message}</div>}

      <div className="management-grid">
        <form className="panel form-panel" onSubmit={handleMemberSubmit}>
          <div className="panel-title-row">
            <h3>{editingMemberId ? "팀원 수정" : "팀원 등록"}</h3>
            {editingMemberId && <button type="button" onClick={() => { setEditingMemberId(null); setMemberForm(emptyMemberForm); }}>취소</button>}
          </div>
          <label>이름<input required value={memberForm.name} onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} /></label>
          <label>부서<input required value={memberForm.department} onChange={(event) => setMemberForm({ ...memberForm, department: event.target.value })} /></label>
          <label>직책<input value={memberForm.position} onChange={(event) => setMemberForm({ ...memberForm, position: event.target.value })} /></label>
          <label>이메일<input type="email" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} /></label>
          <button className="primary-button" type="submit">{editingMemberId ? "수정 저장" : "팀원 등록"}</button>
        </form>

        <div className="panel member-list-panel">
          <div className="panel-title-row">
            <h3>팀원 목록</h3>
            <span>{members.length}명</span>
          </div>
          <div className="member-list">
            {members.map((member) => (
              <article className="member-row" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.department} · {member.position || "직책 없음"}</span>
                  {member.email && <small>{member.email}</small>}
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => startEditMember(member)}>수정</button>
                  <button type="button" onClick={() => deleteMember(member.id)}>삭제</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <form className="panel schedule-form" onSubmit={handleScheduleSubmit}>
        <div className="panel-title-row">
          <h3>{editingScheduleId ? "일정 수정" : "일정 등록"}</h3>
          {editingScheduleId && <button type="button" onClick={() => { setEditingScheduleId(null); setScheduleForm(emptyScheduleForm); }}>취소</button>}
        </div>
        <label>팀원<select required value={scheduleForm.member_id} onChange={(event) => setScheduleForm({ ...scheduleForm, member_id: event.target.value })}>
          <option value="">팀원 선택</option>
          {members.map((member) => <option value={member.id} key={member.id}>{member.name} ({member.department})</option>)}
        </select></label>
        <label>유형<select value={scheduleForm.type} onChange={(event) => setScheduleForm({ ...scheduleForm, type: event.target.value })}>
          {scheduleTypes.map((type) => <option value={type} key={type}>{type}</option>)}
        </select></label>
        <label>제목<input required value={scheduleForm.title} onChange={(event) => setScheduleForm({ ...scheduleForm, title: event.target.value })} /></label>
        <label>시작<input required type="datetime-local" value={scheduleForm.starts_at} onChange={(event) => setScheduleForm({ ...scheduleForm, starts_at: event.target.value })} /></label>
        <label>종료<input required type="datetime-local" value={scheduleForm.ends_at} onChange={(event) => setScheduleForm({ ...scheduleForm, ends_at: event.target.value })} /></label>
        <label>장소<input value={scheduleForm.location} onChange={(event) => setScheduleForm({ ...scheduleForm, location: event.target.value })} /></label>
        <label className="wide-field">메모<input value={scheduleForm.memo} onChange={(event) => setScheduleForm({ ...scheduleForm, memo: event.target.value })} /></label>
        <button className="primary-button" type="submit">{editingScheduleId ? "일정 수정" : "일정 등록"}</button>
      </form>

      <div className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div>
            <h3>{viewMode === "week" ? "주간 일정" : "월간 일정"}</h3>
            <p>{range.start} ~ {range.end}</p>
          </div>
          <div className="toolbar-actions">
            <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
              <option value="">전체 팀원</option>
              {members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
            </select>
            <button type="button" onClick={() => moveRange(-1)}>이전</button>
            <input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} />
            <button type="button" onClick={() => setAnchorDate(toDateInputValue(new Date()))}>오늘</button>
            <button type="button" onClick={() => moveRange(1)}>다음</button>
          </div>
        </div>

        {viewMode === "week" ? (
          <WeeklyScheduleTable schedules={schedules} onEdit={startEditSchedule} onDelete={deleteSchedule} />
        ) : (
          <MonthlyCalendar days={calendarDays} anchorDate={anchorDate} schedules={schedules} onEdit={startEditSchedule} />
        )}
      </div>
    </section>
  );
}

function WeeklyScheduleTable(props: { schedules: Schedule[]; onEdit: (schedule: Schedule) => void; onDelete: (scheduleId: number) => void }) {
  return (
    <div className="table-scroll">
      <table className="schedule-table">
        <thead>
          <tr><th>날짜</th><th>시간</th><th>팀원</th><th>유형</th><th>제목</th><th>장소</th><th>관리</th></tr>
        </thead>
        <tbody>
          {props.schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>{formatDate(schedule.starts_at)}</td>
              <td>{formatTime(schedule.starts_at)}-{formatTime(schedule.ends_at)}</td>
              <td>{schedule.member_name ?? "미지정"}</td>
              <td><span className="type-pill">{schedule.type}</span></td>
              <td>{schedule.title}</td>
              <td>{schedule.location ?? "-"}</td>
              <td className="table-actions"><button type="button" onClick={() => props.onEdit(schedule)}>수정</button><button type="button" onClick={() => props.onDelete(schedule.id)}>삭제</button></td>
            </tr>
          ))}
          {props.schedules.length === 0 && <tr><td colSpan={7} className="empty-cell">해당 기간에 등록된 일정이 없습니다.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyCalendar(props: { days: Date[]; anchorDate: string; schedules: Schedule[]; onEdit: (schedule: Schedule) => void }) {
  const anchor = parseDate(props.anchorDate);
  const schedulesByDate = new Map<string, Schedule[]>();
  props.schedules.forEach((schedule) => {
    const key = schedule.starts_at.slice(0, 10);
    schedulesByDate.set(key, [...(schedulesByDate.get(key) ?? []), schedule]);
  });

  return (
    <div className="month-grid">
      {["월", "화", "수", "목", "금", "토", "일"].map((day) => <div className="weekday" key={day}>{day}</div>)}
      {props.days.map((day) => {
        const key = toDateInputValue(day);
        const daySchedules = schedulesByDate.get(key) ?? [];
        const outsideMonth = day.getMonth() !== anchor.getMonth();
        return (
          <div className={`calendar-day ${outsideMonth ? "muted" : ""}`} key={key}>
            <strong>{day.getDate()}</strong>
            <div className="calendar-events">
              {daySchedules.map((schedule) => (
                <button type="button" key={schedule.id} onClick={() => props.onEdit(schedule)}>
                  <span>{formatTime(schedule.starts_at)}</span> {schedule.member_name ?? "미지정"} · {schedule.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function cleanPayload<T extends Record<string, string>>(form: T): Record<string, string | null> {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() === "" ? null : value.trim()]));
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDatetimeLocalValue(value: string): string {
  return value.slice(0, 16);
}

function getWeekRange(anchorDate: string) {
  const date = parseDate(anchorDate);
  const day = date.getDay() === 0 ? 7 : date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getMonthRange(anchorDate: string) {
  const date = parseDate(anchorDate);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getCalendarDays(anchorDate: string): Date[] {
  const { start, end } = getMonthRange(anchorDate);
  const first = parseDate(start);
  const last = parseDate(end);
  const firstDay = first.getDay() === 0 ? 7 : first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstDay + 1);
  const lastDay = last.getDay() === 0 ? 7 : last.getDay();
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + (7 - lastDay));

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", weekday: "short" }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}