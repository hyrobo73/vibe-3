# Architecture: Public Admin RPA Hub

## 1. 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI, uv |
| Database | SQLite |
| 파일 처리 | pandas, openpyxl |
| 뉴스 수집 | requests 계열 대신 표준 라이브러리 + BeautifulSoup |

## 2. 저장소 구조

```text
.
  package.json
  frontend/
    package.json
    src/
      app/
      features/
      shared/
  backend/
    pyproject.toml
    app/
      core/
      db/
      modules/
      schemas/
      services/
    data/
      uploads/
      exports/
  docs/
    PRD.md
    Architecture.md
    Operation.md
    index.html
```

## 3. 런타임 구조

```text
[React SPA]
    |
    | HTTP/JSON, file upload/download
    v
[FastAPI API]
    |
    | SQLite
    v
[backend/data/app.sqlite3]

[FastAPI startup]
    |-- DB 초기화
    |-- 뉴스 자동 수집 스케줄러 시작
```

## 4. 프런트엔드 구조

### `src/app`

- 라우트 목록과 앱 레이아웃을 관리한다.
- 시작 시 `/api/health`와 `/api/system/status`를 호출해 상태를 보여준다.

### `src/features/schedule`

- 팀원과 일정 CRUD 화면을 제공한다.
- 주간 / 월간 뷰를 전환한다.

### `src/features/excel-automation`

- 파일 업로드, 열 선택, split / merge 작업 실행을 담당한다.
- 작업 결과와 다운로드 링크를 표시한다.

### `src/features/news`

- 지정 날짜의 정책 뉴스 목록과 수집 실행 UI를 제공한다.

### `src/features/complaint-chatbot`

- 현재는 자리표시 패널이다.

### `src/shared`

- API 클라이언트
- 공통 타입
- 공통 스타일과 재사용 컴포넌트

## 5. 백엔드 구조

### `app/main.py`

- FastAPI 애플리케이션 생성
- CORS 설정
- 라우터 등록
- DB 초기화 및 뉴스 스케줄러 시작

### `app/core`

- `config.py`: 앱 이름, 데이터 디렉터리, DB 경로, CORS 허용 오리진
- `logging.py`: 로깅 설정
- `security.py`: 보안 관련 유틸리티

### `app/db`

- SQLite 연결과 초기화 로직
- 테이블 생성 및 샘플 데이터 시드

### `app/modules/team_members`

- 팀원 CRUD
- 비활성화 기반 삭제 처리

### `app/modules/schedules`

- 일정 CRUD
- 활성 팀원 검증
- 시작/종료 시각 검증
- 팀원명 조인을 포함한 조회

### `app/modules/excel_jobs`

- `.xlsx` 헤더 읽기
- split / merge 작업 수행
- 작업 상태와 다운로드 제공

### `app/modules/news`

- 정책 뉴스 수집 서비스
- 수집 API
- 일일 자동 수집 스케줄러

### `app/modules/complaints`, `app/modules/audit`

- 현재는 구조만 준비된 상태다.

## 6. 데이터 모델

### `team_members`

| 컬럼 | 설명 |
| --- | --- |
| id | 팀원 ID |
| name | 이름 |
| department | 부서 |
| position | 직책 |
| email | 이메일 |
| active | 활성 여부 |
| created_at | 생성 시각 |
| updated_at | 수정 시각 |

### `schedules`

| 컬럼 | 설명 |
| --- | --- |
| id | 일정 ID |
| user_id | 사용자 ID 기본값 |
| member_id | 담당 팀원 ID |
| type | 일정 유형 |
| title | 제목 |
| starts_at | 시작 시각 |
| ends_at | 종료 시각 |
| location | 장소 |
| memo | 메모 |
| visibility | 공개 범위 |
| approval_status | 승인 상태 |
| created_at | 생성 시각 |
| updated_at | 수정 시각 |

### `excel_jobs`

| 컬럼 | 설명 |
| --- | --- |
| id | 작업 ID |
| user_id | 사용자 ID 기본값 |
| job_type | `split` 또는 `merge` |
| status | `processing`, `done`, `failed` |
| input_path | 입력 파일 경로 |
| output_path | 결과 파일 경로 |
| error_message | 오류 메시지 |
| created_at | 생성 시각 |

### `news_articles`

| 컬럼 | 설명 |
| --- | --- |
| id | 뉴스 ID |
| title | 제목 |
| source | 출처 |
| published_at | 게시일 |
| url | 원문 URL |
| summary | 요약 |
| keywords | 키워드 |
| collected_at | 수집 시각 |

### `complaint_manuals`, `complaint_chats`, `audit_logs`

- 테이블은 생성되지만 아직 UI와 API가 완성되지 않았다.

## 7. API 개요

### 상태

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/health` | API 상태 확인 |
| GET | `/api/system/status` | API, DB, 기능 목록 확인 |

### 팀원

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/team-members` | 활성 팀원 목록 |
| POST | `/api/team-members` | 팀원 생성 |
| PATCH | `/api/team-members/{member_id}` | 팀원 수정 |
| DELETE | `/api/team-members/{member_id}` | 팀원 비활성화 |

### 일정

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/schedules` | 일정 목록 조회 |
| POST | `/api/schedules` | 일정 생성 |
| PATCH | `/api/schedules/{schedule_id}` | 일정 수정 |
| DELETE | `/api/schedules/{schedule_id}` | 일정 삭제 |

### 엑셀

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/excel/columns` | 첫 시트 헤더 조회 |
| POST | `/api/excel/split` | 열 기준 분리 작업 생성 |
| POST | `/api/excel/merge` | 파일 병합 작업 생성 |
| GET | `/api/excel/jobs/{job_id}` | 작업 상태 조회 |
| GET | `/api/excel/jobs/{job_id}/download` | 결과 파일 다운로드 |

### 뉴스

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/news` | 뉴스 목록 조회 |
| POST | `/api/news/collect` | 지정 날짜 뉴스 수집 |

## 8. 동작 특성

- 앱 시작 시 SQLite 파일이 없으면 생성한다.
- 일정과 엑셀 결과 파일은 `backend/data/uploads`, `backend/data/exports` 아래에 저장한다.
- 뉴스 자동 수집은 매일 오전 9시 KST에 전날 기준으로 시도한다.
- 정책 뉴스 수집은 외부 사이트 HTML 구조에 의존한다.

## 9. 현재 구현의 경계

- 인증, 권한, 감사 로그 조회 화면은 아직 없다.
- 민원 챗봇은 프런트엔드 자리표시 단계다.
- 운영용 배포 설정은 포함하지 않는다.
