from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional
import uvicorn


from database import (
    connect_db,
    disconnect_db,
    fetch_summary,
    fetch_devices,
    fetch_latest_telemetry,
    fetch_device_trends,
    fetch_throughput,
    fetch_top_anomalous_devices,
    fetch_regions_summary,
    fetch_rows,
    execute_query,
    fetch_moisture_tests,
)

from config import settings

class FactoryCreate(BaseModel):
    factory_code: str
    factory_name: str
    location: str

class FactoryUpdate(BaseModel):
    factory_code: Optional[str] = None
    factory_name: Optional[str] = None
    location: Optional[str] = None

class ProductionLineCreate(BaseModel):
    line_code: str
    line_name: str
    status: str = "active"

class ProductionLineUpdate(BaseModel):
    line_code: Optional[str] = None
    line_name: Optional[str] = None
    status: Optional[str] = None

class MachineCreate(BaseModel):
    device_id: str
    machine_name: str
    machine_type: str
    criticality: str = "medium"

class MachineUpdate(BaseModel):
    device_id: Optional[str] = None
    machine_name: Optional[str] = None
    machine_type: Optional[str] = None
    criticality: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Connecting to database...")
    await connect_db()
    yield
    # Shutdown
    print("Disconnecting from database...")
    await disconnect_db()

app = FastAPI(
    title="Axion Telemetry Query Service",
    description="API for the Axion condition monitoring dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/dashboard/summary")
async def get_summary():
    try:
        return await fetch_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices")
async def get_devices():
    try:
        return await fetch_devices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices/{device_id}/latest")
async def get_latest_device_data(device_id: str):
    try:
        data = await fetch_latest_telemetry(device_id)
        if not data:
            raise HTTPException(status_code=404, detail="No telemetry found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices/{device_id}/trends")
async def get_device_trends(device_id: str, hours: int = Query(1, description="Hours of history to fetch")):
    try:
        return await fetch_device_trends(device_id, hours)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices/top-anomalous")
async def get_top_anomalous():
    try:
        return await fetch_top_anomalous_devices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/throughput")
async def get_throughput():
    try:
        return await fetch_throughput()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/regions")
async def get_regions():
    try:
        return await fetch_regions_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FACTORIES API
@app.get("/factories")
async def get_factories():
    try:
        return await fetch_rows("""
            SELECT
                factory_id,
                factory_code,
                factory_name,
                location
            FROM public.factories
            ORDER BY factory_id
        """)
    except Exception as e:
        print("FACTORIES API ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="Factory API failed. Check backend terminal."
        )

@app.post("/factories", status_code=201)
async def create_factory(payload: FactoryCreate):
    try:
        rows = await fetch_rows("""
            INSERT INTO public.factories (factory_code, factory_name, location)
            VALUES ($1, $2, $3)
            RETURNING factory_id, factory_code, factory_name, location
        """, payload.factory_code, payload.factory_name, payload.location)
        return rows[0] if rows else {"message": "Factory created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/factories/{factory_id}")
async def update_factory(factory_id: int, payload: FactoryUpdate):
    try:
        rows = await fetch_rows("""
            UPDATE public.factories
            SET factory_code = COALESCE($1, factory_code),
                factory_name = COALESCE($2, factory_name),
                location = COALESCE($3, location)
            WHERE factory_id = $4
            RETURNING factory_id, factory_code, factory_name, location
        """, payload.factory_code, payload.factory_name, payload.location, factory_id)
        if not rows:
            raise HTTPException(status_code=404, detail="Factory not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/factories/{factory_id}")
async def delete_factory(factory_id: int):
    try:
        await execute_query("DELETE FROM public.factories WHERE factory_id = $1", factory_id)
        return {"message": "Factory deleted successfully", "factory_id": factory_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# PRODUCTION LINES API
@app.get("/factories/{factory_id}/lines")
async def get_factory_lines(factory_id: int):
    try:
        return await fetch_rows("""
            SELECT line_id, factory_id, line_code, line_name, status
            FROM public.production_lines
            WHERE factory_id = $1
            ORDER BY line_code
        """, factory_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/factories/{factory_id}/lines", status_code=201)
async def create_factory_line(factory_id: int, payload: ProductionLineCreate):
    try:
        rows = await fetch_rows("""
            INSERT INTO public.production_lines (factory_id, line_code, line_name, status)
            VALUES ($1, $2, $3, $4)
            RETURNING line_id, factory_id, line_code, line_name, status
        """, factory_id, payload.line_code, payload.line_name, payload.status)
        return rows[0] if rows else {"message": "Line created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/production-lines/{line_id}")
async def update_production_line(line_id: int, payload: ProductionLineUpdate):
    try:
        rows = await fetch_rows("""
            UPDATE public.production_lines
            SET line_code = COALESCE($1, line_code),
                line_name = COALESCE($2, line_name),
                status = COALESCE($3, status)
            WHERE line_id = $4
            RETURNING line_id, factory_id, line_code, line_name, status
        """, payload.line_code, payload.line_name, payload.status, line_id)
        if not rows:
            raise HTTPException(status_code=404, detail="Production line not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/production-lines/{line_id}")
async def delete_production_line(line_id: int):
    try:
        await execute_query("DELETE FROM public.production_lines WHERE line_id = $1", line_id)
        return {"message": "Production line deleted successfully", "line_id": line_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# MACHINES API
@app.get("/production-lines/{line_id}/machines")
async def get_line_machines(line_id: int):
    try:
        return await fetch_rows("""
            SELECT machine_id, line_id, device_id, machine_name,
                   machine_type, criticality
            FROM public.machines
            WHERE line_id = $1
            ORDER BY device_id
        """, line_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/production-lines/{line_id}/machines", status_code=201)
async def create_line_machine(line_id: int, payload: MachineCreate):
    try:
        rows = await fetch_rows("""
            INSERT INTO public.machines (line_id, device_id, machine_name, machine_type, criticality)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING machine_id, line_id, device_id, machine_name, machine_type, criticality
        """, line_id, payload.device_id, payload.machine_name, payload.machine_type, payload.criticality)
        return rows[0] if rows else {"message": "Machine created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/machines/{machine_id}")
async def update_machine(machine_id: int, payload: MachineUpdate):
    try:
        rows = await fetch_rows("""
            UPDATE public.machines
            SET device_id = COALESCE($1, device_id),
                machine_name = COALESCE($2, machine_name),
                machine_type = COALESCE($3, machine_type),
                criticality = COALESCE($4, criticality)
            WHERE machine_id = $5
            RETURNING machine_id, line_id, device_id, machine_name, machine_type, criticality
        """, payload.device_id, payload.machine_name, payload.machine_type, payload.criticality, machine_id)
        if not rows:
            raise HTTPException(status_code=404, detail="Machine not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/machines/{machine_id}")
async def delete_machine(machine_id: int):
    try:
        await execute_query("DELETE FROM public.machines WHERE machine_id = $1", machine_id)
        return {"message": "Machine deleted successfully", "machine_id": machine_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/moisture-tests")
async def get_moisture_tests():
    try:
        return await fetch_moisture_tests()
    except Exception as e:
        print("MOISTURE API ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="Moisture API failed. Check backend terminal."
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

