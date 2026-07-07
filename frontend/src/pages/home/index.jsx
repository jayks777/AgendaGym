import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
        <Link to="/aluno/dashboard">Go to aluno dashboard</Link><br></br>
        <Link to="/professor/dashboard">Go to professor dashboard</Link>
    </div>
  );
}