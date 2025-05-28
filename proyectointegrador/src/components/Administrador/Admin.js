import { auth, provider, db } from "../servicios/firebase.js";
import './doctor.css'
const Admin = () => {




    return (
        <>
        <div>
            <h1>Hola Doctor</h1>
        </div>

        <div className="contenedortabla"> 

       <table className="tabla-citas">
        <thead>
            <tr>
            <th>Paciente</th>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            <tr>
            <td>Juan Pérez</td>
            <td>2025-05-30</td>
            <td>Control general</td>
            <td><span className="estado pendiente">Pendiente</span></td>
            </tr>
            <tr>
            <td>María López</td>
            <td>2025-06-01</td>
            <td>Consulta oftalmológica</td>
            <td><span className="estado completado">Completado</span></td>
            </tr>
        </tbody>
        </table>
    </div>
        
        </>

    );
}

export default Admin;