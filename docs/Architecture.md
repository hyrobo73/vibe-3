# Architecture: 공공직군 행정업무 슈퍼앱

## 1. 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | TypeScript, Vite, React |
| Backend | Python, FastAPI, uv |
| Database | SQLite |
| Package Manager | npm, uv |
| 문서 | Markdown, HTML |

## 2. 전체 구조

```text
day3_rpa/
  frontend/
    package.json
    package-lock.json
    node_modules/
  backend/
    pyproject.toml
    uv.lock
    .venv/
  docs/
    PRD.md
    Architecture.md
    Operation.md
    index.html
```

## 3. 권장 프로젝트 구조

아래 구조는 구현 단계에서 확장할 기준 구조다.

```text
frontend/
  src/
    app/
      App.tsx
      routes.tsx
    features/
      schedule/
      excel-automation/
      complaint-chatbot/
      news/
    shared/
      api/
      components/
      hooks/
      styles/
      types/

backend/
  app/
    main.py
    core/
      config.py
      security.py
      logging.py
    db/
      connection.py
      migrations/
    modules/
      schedules/
      excel_jobs/
      complaints/
      news/
      audit/
    schemas/
    services/
    tests/
  data/
    app.sqlite3
    uploads/
    exports/
```

## 4. 시스템 구성

```text
[React SPA]
    |
    | HTTP/JSON, file upload/download
    v
[FastAPI Backend]
    |
    | SQL
    v
[SQLite]

[FastAPI Background Jobs]
    |-- 뉴스 수집
    |-- 엑셀 처리
    |-- 매뉴얼 인덱싱
```

## 5. 모듈별 역할

### 5.1 Frontend

#### app

- 라우팅과 전역 레이아웃을 관리한다.
- 사용자 인증 상태와 공통 에러 화면을 처리한다.

#### features/schedule

- 팀원 일정 캘린더 화면을 제공한다.
- 일정 등록, 수정, 삭제, 필터 기능을 담당한다.

#### features/excel-automation

- 엑셀 파일 업로드 UI를 제공한다.
- 컬럼 선택, 분리/병합 옵션, 결과 다운로드를 담당한다.

#### features/complaint-chatbot

- 민원 입력, 매뉴얼 첨부, 챗봇 응답 화면을 제공한다.
- 답변 근거 문서와 주의 문구를 표시한다.

#### features/news

- 수집된 뉴스 목록과 날짜/키워드 필터를 제공한다.
- 기사 링크, 요약, 관련 키워드를 표시한다.

#### shared

- API 클라이언트, 공통 UI 컴포넌트, 공통 타입을 관리한다.

### 5.2 Backend

#### core

- 환경 설정, 보안, 로깅, 공통 예외 처리를 담당한다.

#### db

- SQLite 연결과 트랜잭션을 관리한다.
- 초기 단계에서는 SQLite 파일 기반 저장소를 사용한다.

#### modules/schedules

- 일정 CRUD API를 제공한다.
- 일정 유형, 승인 상태, 사용자별 조회 조건을 처리한다.

#### modules/excel_jobs

- 엑셀 업로드, 분리, 병합, 결과 파일 생성을 담당한다.
- 구현 시 `openpyxl` 또는 `pandas` 사용을 검토한다.

#### modules/complaints

- 민원 매뉴얼 업로드와 질의응답 처리를 담당한다.
- 답변 생성 시 참조 문서와 근거를 함께 반환한다.

#### modules/news

- 뉴스 수집 키워드 관리와 수집 결과 저장을 담당한다.
- 매일 아침 실행되는 백그라운드 작업으로 확장한다.

#### modules/audit

- 주요 사용자 행위와 시스템 이벤트를 기록한다.
- 개인정보가 로그에 남지 않도록 필터링한다.

## 6. 데이터 모델 초안

### users

| 컬럼 | 설명 |
| --- | --- |
| id | 사용자 ID |
| name | 이름 |
| email | 이메일 |
| role | 역할 |
| department | 부서 |
| created_at | 생성일시 |

### schedules

| 컬럼 | 설명 |
| --- | --- |
| id | 일정 ID |
| user_id | 작성자 |
| type | 휴가, 근무, 출장, 교육, 기타 |
| title | 제목 |
| starts_at | 시작일시 |
| ends_at | 종료일시 |
| location | 장소 |
| visibility | 공개 범위 |
| approval_status | 승인 상태 |

### excel_jobs

| 컬럼 | 설명 |
| --- | --- |
| id | 작업 ID |
| user_id | 요청자 |
| job_type | split 또는 merge |
| status | pending, processing, done, failed |
| input_path | 입력 파일 경로 |
| output_path | 결과 파일 경로 |
| error_message | 오류 메시지 |
| created_at | 생성일시 |

### complaint_manuals

| 컬럼 | 설명 |
| --- | --- |
| id | 매뉴얼 ID |
| title | 매뉴얼명 |
| file_path | 파일 경로 |
| uploaded_by | 업로드 사용자 |
| created_at | 생성일시 |

### complaint_chats

| 컬럼 | 설명 |
| --- | --- |
| id | 대화 ID |
| user_id | 사용자 |
| question | 민원 내용 |
| answer | 응답 초안 |
| references | 참조 문서 |
| created_at | 생성일시 |

### news_articles

| 컬럼 | 설명 |
| --- | --- |
| id | 기사 ID |
| title | 제목 |
| source | 언론사 |
| published_at | 발행일 |
| url | 기사 URL |
| summary | 요약 |
| keywords | 관련 키워드 |
| collected_at | 수집일시 |

### audit_logs

| 컬럼 | 설명 |
| --- | --- |
| id | 로그 ID |
| user_id | 사용자 |
| action | 행위 |
| resource_type | 대상 유형 |
| resource_id | 대상 ID |
| created_at | 생성일시 |

## 7. API 설계 초안

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/schedules` | 일정 목록 조회 |
| POST | `/api/schedules` | 일정 생성 |
| PATCH | `/api/schedules/{id}` | 일정 수정 |
| DELETE | `/api/schedules/{id}` | 일정 삭제 |
| POST | `/api/excel/split` | 엑셀 분리 작업 생성 |
| POST | `/api/excel/merge` | 엑셀 병합 작업 생성 |
| GET | `/api/excel/jobs/{id}` | 엑셀 작업 상태 조회 |
| GET | `/api/excel/jobs/{id}/download` | 결과 파일 다운로드 |
| POST | `/api/complaints/manuals` | 민원 매뉴얼 업로드 |
| POST | `/api/complaints/chat` | 민원 대응 초안 생성 |
| GET | `/api/news` | 뉴스 목록 조회 |
| POST | `/api/news/collect` | 뉴스 수집 수동 실행 |

## 8. SQLite 사용 기준

- 개발 및 MVP 단계에서는 SQLite를 기본 DB로 사용한다.
- DB 파일은 `backend/data/app.sqlite3`에 둔다.
- 동시 쓰기 요청이 많아지면 PostgreSQL 전환을 검토한다.
- 파일 업로드 원본과 결과물은 DB에 직접 저장하지 않고 파일 경로만 저장한다.

## 9. 보안 고려사항

- 모든 API는 인증 이후 접근하는 것을 원칙으로 한다.
- 역할 기반 권한 검사를 API 레벨에서 수행한다.
- 파일 업로드 시 확장자, MIME 타입, 파일 크기를 검증한다.
- 민원 매뉴얼과 챗봇 입력에는 개인정보가 포함될 수 있으므로 로그에 원문 저장을 제한한다.
- 뉴스 기사 전문을 무단 저장하지 않고 URL과 요약 중심으로 저장한다.
