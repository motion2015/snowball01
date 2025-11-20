import Footer from './components/Footer'
import Header from './components/Header'
import Main from './components/Main'
import User from './components/User'

export default function App() {
  const userObj = { name: '철수', age: 20 }
  const clickHandler = () => {
    console.log('클릭됨!!')
  }
  return (
    <>
      <Header />
      <Main />
      <User userObj={userObj} clickHandler={clickHandler} />
      <Footer />
    </>
  )
}
