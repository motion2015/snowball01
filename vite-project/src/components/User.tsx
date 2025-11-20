export default function User(props: {
  userObj: { name: string; age: number }
  clickHandler: () => void
}) {
    const { name, age } = props.userObj;
    const { clickHandler } = props;
  return (
    <>
      <h1>{name}님 환영합니다!</h1>
      <h2>나이: {age}세</h2>
      <button onClick={clickHandler}>클릭해 주세요!</button>
    </>
  )
}
