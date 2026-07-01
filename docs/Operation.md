# Operation: 공공직군 행정업무 슈퍼앱

## 1. 현재 구성 상태

현재 저장소는 구현 전 초기 구성 상태다.

- FE: `frontend` 폴더에 React, React DOM, TypeScript, Vite, Vite React Plugin 설치 완료
- BE: `backend` 폴더에 uv 프로젝트, `.venv`, FastAPI 설치 완료
- DB: Python 내장 SQLite 사용 가능
- 문서: `docs` 폴더에 기획/아키텍처/운영 문서 작성

## 2. 사전 요구사항

### Frontend

- Node.js
- npm

현재 확인된 버전:

```bash
node --version
npm --version
```

### Backend

- Python
- uv

현재 확인된 버전:

```bash
python --version
uv --version
```

### Database

SQLite CLI는 필수는 아니다. Python의 `sqlite3` 모듈을 통해 SQLite를 사용할 수 있다.

```bash
python -c "import sqlite3; print(sqlite3.sqlite_version)"
```

## 3. 설치 상태 확인

### Frontend 의존성 확인

```bash
cd frontend
npm ls --depth=0
```

설치된 주요 패키지:

- `react`
- `react-dom`
- `typescript`
- `vite`
- `@vitejs/plugin-react`
- `@types/react`
- `@types/react-dom`

### Backend 의존성 확인

```bash
cd backend
.\.venv\Scripts\python.exe -c "import fastapi; print(fastapi.__version__)"
```

## 4. 실행 방법

아직 애플리케이션 코드가 작성되지 않았으므로 실제 서버 실행 명령은 구현 이후 확정한다.

### Frontend 실행 예정 명령

Vite 설정과 React 진입 파일이 생성된 이후 다음 명령으로 실행한다.

```bash
cd frontend
npm run dev
```

### Backend 실행 예정 명령

FastAPI 앱 진입점이 `backend/app/main.py`로 생성된 이후 다음 명령으로 실행한다.

```bash
cd backend
uv run fastapi dev app/main.py
```

또는 `uvicorn`을 직접 사용할 경우:

```bash
cd backend
uv run uvicorn app.main:app --reload
```

## 5. 운영 사용법 초안

### 팀원 스케줄 관리

1. 사용자가 로그인한다.
2. 캘린더 화면에서 팀 또는 개인 일정을 조회한다.
3. 휴가, 근무, 출장 등 일정 유형을 선택해 일정을 등록한다.
4. 팀 관리자는 전체 팀원 일정을 필터링해 확인한다.

### 엑셀 업무 자동화

1. 사용자가 엑셀 파일을 업로드한다.
2. 분리 또는 병합 작업을 선택한다.
3. 분리 작업인 경우 기준 컬럼을 선택한다.
4. 시스템이 결과 파일을 생성한다.
5. 사용자가 결과 파일을 다운로드한다.

### 민원 대응 챗봇

1. 사용자가 민원 내용을 입력한다.
2. 관련 민원 매뉴얼을 첨부하거나 선택한다.
3. 챗봇이 대응 절차와 응대 스크립트 초안을 생성한다.
4. 사용자는 참조 근거를 확인하고 최종 문안을 검토한다.

### 뉴스 기사 수집

1. 시스템이 매일 아침 지정된 시간에 뉴스를 수집한다.
2. 사용자는 날짜와 키워드 기준으로 뉴스를 조회한다.
3. 사용자는 기사 링크와 요약을 확인한다.

## 6. 자주 발생하는 에러와 대응

### npm install 실패

증상:

```text
npm error code ENOTCACHED
```

원인:

- 네트워크 접근 제한
- npm 캐시 접근 권한 문제

대응:

```bash
cd frontend
npm install
```

필요 시 네트워크와 npm 캐시 디렉터리 접근 권한을 확인한다.

### uv 캐시 접근 실패

증상:

```text
Failed to initialize cache at C:\Users\admin\AppData\Local\uv\cache
액세스가 거부되었습니다.
```

원인:

- uv가 사용자 로컬 캐시 디렉터리에 접근하지 못함

대응:

- 권한이 있는 터미널에서 재실행한다.
- uv 캐시 디렉터리 권한을 확인한다.
- 필요한 경우 `UV_CACHE_DIR`을 프로젝트 내부 또는 접근 가능한 경로로 지정한다.

예시:

```bash
cd backend
$env:UV_CACHE_DIR="C:\tmp\uv-cache"
uv sync
```

### uv venv 실행 시 이미 존재 오류

증상:

```text
A virtual environment already exists at: .venv
```

원인:

- `.venv`가 이미 생성되어 있음

대응:

- 기존 `.venv`를 그대로 사용한다.
- 재생성이 필요할 때만 `uv venv --clear`를 사용한다.

### FastAPI import 실패

증상:

```text
ModuleNotFoundError: No module named 'fastapi'
```

원인:

- 가상환경이 활성화되지 않았거나 의존성이 설치되지 않음

대응:

```bash
cd backend
uv add fastapi
.\.venv\Scripts\python.exe -c "import fastapi; print(fastapi.__version__)"
```

### sqlite3 CLI 미설치

증상:

```text
sqlite3 : The term 'sqlite3' is not recognized
```

원인:

- SQLite CLI가 PATH에 없음

대응:

- MVP 개발에는 Python 내장 `sqlite3` 사용으로 충분하다.
- CLI가 필요하면 SQLite 공식 CLI를 설치하고 PATH에 추가한다.

## 7. 운영 원칙

- 민원 내용, 매뉴얼, 엑셀 파일에는 개인정보가 포함될 수 있으므로 접근 권한을 제한한다.
- 파일 다운로드 URL은 인증된 사용자에게만 제공한다.
- 뉴스 기사 전문을 저장하지 않고 URL과 요약 위주로 저장한다.
- 챗봇 답변은 최종 답변이 아니라 업무 담당자의 검토용 초안으로 취급한다.
- 챗봇이 근거 없는 내용을 생성하지 않도록 매뉴얼 참조 정보를 함께 표시한다.

## 8. 다음 구현 단계

1. Frontend Vite 설정 파일과 React 진입 파일 생성
2. Backend FastAPI 앱 진입점 생성
3. SQLite 연결 모듈 작성
4. 일정 관리 MVP API와 화면 구현
5. 엑셀 처리 모듈 구현
6. 민원 매뉴얼 업로드와 챗봇 응답 구조 구현
7. 뉴스 수집 작업 구현
