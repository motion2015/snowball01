1. 깃 연결

```bash
echo "# snowball01" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/motion2015/snowball01.git
git push -u origin main

```

2. 현재 브랜치의 연결 관계(추적 관계)를 확인하는 방법

- git branch 명령어 사용하기
  ```bash
  git branch -vv
  ```
- git status 명령어 사용하기

  ```bash
  git status
  ```

3.  편집기 탐색

- 메시지를 편집하려면 : i키를 눌러 삽입 모드로 전환
- 메시지를 저장하고 종료하려면 : ESC키를 눌러 삽입모드 종류후 :wq(쓰기 및 종료)입력하고 Enter키를 누른다. -> 커밋 완료
- 커밋을 취소하려면: ESC키를 눌러 종료후 :q! (저장하지 않고 종료)를 입력하고 Enter키를 누른다. 커밋이 취소되고 Git이 터미널로 돌아간다.

3. branch에서 작업후 처음 push 할때 오류남.

- 이 오류의 핵심은 로컬 브랜치(예: feature_pms0914)에 원격 저장소(origin)에 해당하는 같은 이름의 브랜치가 없다는 것입니다. Git은 어디로 푸시해야 할지 추측하는 대신, 명확하게 지정해 달라고 요청합니다.
- `git push origin HEAD:main` `-> 로컬 저장소에 올라감(작업컴퓨터의 브랜치안에)`
  이 명령어는 현재 로컬 브랜치(HEAD)를 원격 저장소(origin)의 main 브랜치로 푸시하라고 Git에 지시합니다. 만약 로컬 feature_pms0914 브랜치의 코드로 원격 main 브랜치를 업데이트하고 싶을 때 이 옵션을 사용하면 됩니다.
- `git push origin HEAD` `-> github에 브랜치로 바로 올라감.`
  이 명령어는 현재 로컬 브랜치를 원격 저장소에 같은 이름의 새 브랜치로 푸시하라고 Git에 지시합니다. 예를 들어, 로컬 브랜치가 feature_pms0914라면, 이 명령어는 원격 저장소에 feature_pms0914라는 새 브랜치를 만들고 변경 사항을 그곳에 푸시합니다.
- `권장되는 해결 방법`
  대부분의 워크플로우에서는 두 번째 옵션인 git push origin HEAD를 선택해야 합니다.
  - 이 방법은 기능별 브랜치 워크플로우의 표준 관행입니다. 로컬에서 작업한 내용을 원격에서도 같은 이름의 브랜치에 따로 보관하는 것이 일반적입니다.
  - 이 명령어를 실행하면, Git은 자동으로 추적 관계를 설정해 줍니다. 따라서 다음번부터는 이 브랜치에서 git push 명령어만으로도 변경 사항을 올릴 수 있게 됩니다.

4. main 에서 브랜치(feature_pms0914)의 내용을 가셔와서 병합

```bash
git checkout main
git merge feature_pms0914
```

5. Emmet 정리

```html
ul>li*4>a[href="#"]>{한} .container>.item.item${$}*10
```

6. flex

```
flex: 1  -> flex: 1 1 0% 와 동일 (flex-grow flex-shrink flex-basis)
```

7. 윈도우 단축키

```
ctrl + R
ctrl + shift + R (강력 새로고침)
```
