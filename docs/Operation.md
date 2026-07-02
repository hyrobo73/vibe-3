# Operation: Public Admin RPA Hub

## 1. 구성

- Frontend: `frontend` 디렉터리의 React + TypeScript + Vite 앱
- Backend: `backend` 디렉터리의 FastAPI 앱
- Database: `backend/data/app.sqlite3`
- File storage: `backend/data/uploads`, `backend/data/exports`

## 2. 필요 환경

### Frontend

- Node.js
- npm

확인:

```bash
node --version
npm --version
```

### Backend

- Python 3.14 이상
- uv

확인:

```bash
python --version
uv --version
```

SQLite CLI는 필수가 아니다. 필요하면 Python 표준 라이브러리로 확인할 수 있다.

```bash
python -c "import sqlite3; print(sqlite3.sqlite_version)"
```

## 3. 설치

### Frontend

```bash
npm --prefix frontend install
```

또는:

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
uv sync
```

의존성 확인:

```bash
cd backend
uv run python -c "import fastapi, openpyxl, pandas; print(fastapi.__version__, openpyxl.__version__, pandas.__version__)"
```

## 4. 실행

루트 디렉터리 `day3_rpa`에서 실행하는 방식이 가장 간단하다.

### Frontend

```bash
npm run dev
```

기본 주소:

```text
http://127.0.0.1:5173
```

### Backend

```bash
npm run dev:backend
```

기본 주소:

```text
http://127.0.0.1:8000
```

상태 확인:

```bash
curl http://127.0.0.1:8000/api/health
```

PowerShell에서는:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

### 직접 실행

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

개발 중 자동 재시작이 필요하면 backend에 `--reload`를 붙인다.

```bash
cd backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## 5. 빌드와 검증

### Frontend 빌드

```bash
npm run build
```

### Backend import 확인

```bash
cd backend
uv run python -c "from app.main import app; print(app.title)"
```

### Python 문법 확인

```bash
python -m compileall backend\app
```

## 6. 주요 사용 흐름

### 일정 관리

1. 팀원을 먼저 등록한다.
2. 일정 화면에서 팀원, 일정 유형, 시작/종료 시각을 입력한다.
3. 주간 또는 월간 보기로 일정을 확인한다.

### 엑셀 자동화

1. `.xlsx` 파일을 업로드한다.
2. Split 모드에서는 기준 열을 선택한다.
3. Merge 모드에서는 헤더가 같은 파일을 두 개 이상 선택한다.
4. 생성된 작업의 다운로드 링크로 결과 파일을 받는다.

### 뉴스 수집

1. 날짜를 선택한다.
2. 수집 버튼을 누른다.
3. 수집 결과와 기사 목록을 확인한다.

## 7. 자주 보는 오류

### `npm install` 실패

```text
npm error code ENOTCACHED
```

해결:

```bash
npm --prefix frontend install
```

### `uv sync` 캐시 문제

```text
Failed to initialize cache ... Access is denied.
```

해결:

```powershell
cd backend
$env:UV_CACHE_DIR="C:\tmp\uv-cache"
uv sync
```

### FastAPI import 실패

```text
ModuleNotFoundError: No module named 'fastapi'
```

해결:

```bash
cd backend
uv sync
uv run python -c "import fastapi; print(fastapi.__version__)"
```

### 엑셀 업로드 실패

- 파일 확장자는 `.xlsx` 여야 한다.
- 첫 시트의 첫 행은 헤더여야 한다.
- 병합은 모든 파일의 헤더 이름과 순서가 같아야 한다.

## 8. 운영 메모

- 업로드 파일과 결과 파일은 `backend/data` 아래에 남는다.
- 뉴스 수집은 외부 사이트 응답에 의존하므로 실패할 수 있다.
- 현재 프로젝트에는 별도 인증 절차가 없다.
- 민원 챗봇과 감사 로그는 아직 완성되지 않았다.
