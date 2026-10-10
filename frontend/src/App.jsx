import React, { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronDown,
  Factory,
  Gauge,
  Menu,
  RefreshCw,
  Server,
  Settings,
  Thermometer,
  Waves,
  Zap,
  Sliders,
  Database,
  ShieldAlert,
  Download,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Radio,
  Trash2,
  Save,
  Terminal,
  FileText,
  Cpu,
  Plus,
  Edit3,
  Trash,
  PlusCircle,
  X,
} from "lucide-react";

import {

  Area,

  AreaChart,

  CartesianGrid,

  Line,

  LineChart,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts";

const API_URL = "http://127.0.0.1:8000";

function App() {

  const [summary, setSummary] = useState({});

  const [devices, setDevices] = useState([]);

  const [trends, setTrends] = useState([]);

  const [anomalies, setAnomalies] = useState([]);

  const [regions, setRegions] = useState([]);

  const [selectedDevice, setSelectedDevice] = useState("");

  const [loading, setLoading] = useState(false);

  const [activePage, setActivePage] = useState("Dashboard");
  const [moistureTests, setMoistureTests] = useState([]);
  const [moistureError, setMoistureError] = useState("");

  const [selectedTenant, setSelectedTenant] = useState(() => localStorage.getItem("axion_tenant_id") || "demo-tenant");
  const [selectedGateway, setSelectedGateway] = useState(() => localStorage.getItem("axion_gateway_id") || "iot2050-office");
  const [showNotifications, setShowNotifications] = useState(false);
  const [gatewayList] = useState(() => {
    try {
      const saved = localStorage.getItem("axion_gateway_list");
      return saved ? JSON.parse(saved) : ["iot2050-office", "gateway-refinery-01", "gateway-factory-02"];
    } catch (e) {
      return ["iot2050-office", "gateway-refinery-01", "gateway-factory-02"];
    }
  });

  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem("axion_location_id") || "ALL");

  const loadDashboard = async () => {

    try {

      setLoading(true);

      const [

        summaryResponse,

        devicesResponse,

        anomaliesResponse,

        regionsResponse,

      ] = await Promise.all([

        fetch(`${API_URL}/dashboard/summary`),

        fetch(`${API_URL}/devices`),

        fetch(`${API_URL}/devices/top-anomalous`),

        fetch(`${API_URL}/dashboard/regions`),

      ]);

      const summaryData = await summaryResponse.json();

      const devicesData = await devicesResponse.json();

      const anomaliesData = await anomaliesResponse.json();

      const regionsData = await regionsResponse.json();

      setSummary(summaryData);

      setDevices(devicesData || []);

      setAnomalies(anomaliesData || []);

      setRegions(regionsData || []);

      if (!selectedDevice && devicesData?.length > 0) {

        setSelectedDevice(devicesData[0].device_id);

      }

    } catch (error) {

      console.error("Dashboard API error:", error);

    } finally {

      setLoading(false);

    }

  };

  const loadTrends = async (deviceId) => {

    if (!deviceId) return;

    try {

      const response = await fetch(

        `${API_URL}/devices/${encodeURIComponent(

          deviceId

        )}/trends?hours=24`

      );

      const data = await response.json();

      console.log("Trend API response:", data);

      console.log("Trend data is array:", Array.isArray(data));

      setTrends(data || []);

    } catch (error) {

      console.error("Trend API error:", error);

      setTrends([]);

    }

  };

  useEffect(() => {
    const refreshDashboard = async () => {
      await loadDashboard();

      if (selectedDevice) {
        await loadTrends(selectedDevice);
      }
    };

    refreshDashboard();

    const interval = setInterval(() => {
      refreshDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedDevice]);

  useEffect(() => {

    if (selectedDevice) {

      loadTrends(selectedDevice);

    }

  }, [selectedDevice]);

  useEffect(() => {
    let cancelled = false;

    const loadMoistureTests = async () => {
      try {
        const response = await fetch(`${API_URL}/moisture-tests`);

        if (!response.ok) {
          throw new Error(`API failed: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setMoistureTests(Array.isArray(data) ? data : []);
          setMoistureError("");
        }
      } catch (error) {
        if (!cancelled) {
          setMoistureError(error.message);
          console.error("Moisture API error:", error);
        }
      }
    };

    loadMoistureTests();

    const interval = setInterval(loadMoistureTests, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Extract unique locations from devices & regions
  const locationList = Array.from(
    new Set([
      ...devices.map((d) => d.refinery_region).filter(Boolean),
      ...regions.map((r) => r.region).filter(Boolean),
    ])
  );

  const filteredDevices = selectedLocation === "ALL"
    ? devices
    : devices.filter((d) => (d.refinery_region || "").toLowerCase() === selectedLocation.toLowerCase());

  const currentDevice = devices.find(
    (device) => device.device_id === selectedDevice
  ) || filteredDevices[0] || devices[0];

  const temperature = Number(currentDevice?.temperature || 0);

  const vibration = Number(currentDevice?.vibration || 0);

  const current = Number(currentDevice?.current || 0);

  const chartData = (Array.isArray(trends) ? trends : [])

    .filter((item) => item.timestamp != null)

    .map((item) => ({

      time: new Date(item.timestamp).toLocaleTimeString([], {

        hour: "2-digit",

        minute: "2-digit",

      }),

      timestamp: new Date(item.timestamp).getTime(),

      temperature: Number(item.temperature),

      vibration: Number(item.vibration),

      current: Number(item.current),

    }))

    .filter(

      (item) =>

        Number.isFinite(item.temperature) &&

        Number.isFinite(item.current)

    )

    .sort((a, b) => a.timestamp - b.timestamp);

  const sortedMoistureTests = [...moistureTests].sort(
    (a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const moistureValues = sortedMoistureTests
    .map((sample) => Number(sample.moisture_percentage))
    .filter(Number.isFinite);

  const averageMoisture = moistureValues.length
    ? moistureValues.reduce((sum, value) => sum + value, 0) /
    moistureValues.length
    : 0;

  const highestMoisture = moistureValues.length
    ? Math.max(...moistureValues)
    : 0;

  const latestMoisture = sortedMoistureTests[0];

  const moistureChartData = sortedMoistureTests
    .slice(0, 20)
    .reverse()
    .map((sample) => ({
      sample: sample.sample_name || `Sample ${sample.id}`,
      moisture: Number(sample.moisture_percentage),
    }))
    .filter((sample) => Number.isFinite(sample.moisture));

  const onlineCount = filteredDevices.filter((d) => (d.status || "").toLowerCase() === "healthy" || (d.status || "").toLowerCase() === "running" || Number(d.temperature) > 0).length;

  const filteredAnomalies = selectedLocation === "ALL"
    ? anomalies
    : anomalies.filter((a) => {
        const dev = devices.find((d) => d.device_id === a.device_id);
        return dev && (dev.refinery_region || "").toLowerCase() === selectedLocation.toLowerCase();
      });

  return (

    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-box">

            <Activity size={22} />

          </div>

          <div>

            <strong>AXION</strong>

            <span>TELEMETRY</span>

          </div>

        </div>

        <div className="menu-title">

          MONITORING

        </div>

        <button

          className={`menu-item ${activePage === "Dashboard" ? "active" : ""}`}

          onClick={() => setActivePage("Dashboard")}

        >

          <Gauge size={18} />

          Dashboard

        </button>

        <button

          className={`menu-item ${activePage === "Factory Overview" ? "active" : ""}`}

          onClick={() => setActivePage("Factory Overview")}

        >

          <Factory size={18} />

          Factory Overview

        </button>

        <button

          className={`menu-item ${activePage === "Production Line" ? "active" : ""}`}

          onClick={() => setActivePage("Production Line")}

        >

          <Server size={18} />

          Production Line

        </button>

        <button
          className={`menu-item ${activePage === "Moisture Quality" ? "active" : ""
            }`}
          onClick={() => setActivePage("Moisture Quality")}
        >
          <Waves size={18} />
          Moisture Quality
        </button>

        <button

          className={`menu-item ${activePage === "Data Explorer" ? "active" : ""}`}

          onClick={() => setActivePage("Data Explorer")}

        >

          <BarChart3 size={18} />

          Data Explorer

        </button>

        <button

          className={`menu-item ${activePage === "Alerts" ? "active" : ""}`}

          onClick={() => setActivePage("Alerts")}

        >

          <AlertTriangle size={18} />

          Alerts

          <span className="alert-count">{anomalies.length}</span>

        </button>

        <div className="menu-title system-title">

          SYSTEM

        </div>

        <button

          className={`menu-item ${activePage === "Settings" ? "active" : ""}`}

          onClick={() => setActivePage("Settings")}

        >

          <Settings size={18} />

          Settings

        </button>

        <div className="system-status">

          <span className="online-dot"></span>

          <div>

            <strong>System Online</strong>

            <small>Telemetry service</small>

          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main">

        {/* HEADER */}

        <header className="header">

          <div className="header-left">

            <button className="mobile-menu">

              <Menu size={22} />

            </button>

            <div>

              <span className="eyebrow">

                INDUSTRIAL MONITORING

              </span>

              <h1>

                Telemetry Dashboard

              </h1>

            </div>

          </div>

          <div className="header-actions">
            <div className="selector" style={{ borderColor: selectedLocation !== "ALL" ? "#38bdf8" : undefined }}>
              <small style={{ color: selectedLocation !== "ALL" ? "#38bdf8" : undefined }}>LOCATION</small>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  const loc = e.target.value;
                  setSelectedLocation(loc);
                  localStorage.setItem("axion_location_id", loc);
                  // auto-select first device under this location if available
                  const matchingDevs = loc === "ALL" 
                    ? devices 
                    : devices.filter((d) => (d.refinery_region || "").toLowerCase() === loc.toLowerCase());
                  if (matchingDevs.length > 0) {
                    setSelectedDevice(matchingDevs[0].device_id);
                  }
                }}
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="ALL" style={{ background: "#0b1420", color: "#e5edf8" }}>ALL LOCATIONS ({devices.length})</option>
                {locationList.map((loc) => {
                  const count = devices.filter((d) => (d.refinery_region || "").toLowerCase() === loc.toLowerCase()).length;
                  return (
                    <option key={loc} value={loc} style={{ background: "#0b1420", color: "#e5edf8" }}>
                      {loc} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="selector">
              <small>TENANT</small>
              <select
                value={selectedTenant}
                onChange={(e) => {
                  setSelectedTenant(e.target.value);
                  localStorage.setItem("axion_tenant_id", e.target.value);
                }}
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="demo-tenant" style={{ background: "#0b1420", color: "#e5edf8" }}>demo-tenant</option>
                <option value="enterprise-plant-north" style={{ background: "#0b1420", color: "#e5edf8" }}>enterprise-plant-north</option>
                <option value="refinery-zone-01" style={{ background: "#0b1420", color: "#e5edf8" }}>refinery-zone-01</option>
                <option value="factory-zone-south" style={{ background: "#0b1420", color: "#e5edf8" }}>factory-zone-south</option>
              </select>
            </div>

            <div className="selector">
              <small>GATEWAY</small>
              <select
                value={selectedGateway}
                onChange={(e) => {
                  setSelectedGateway(e.target.value);
                  localStorage.setItem("axion_gateway_id", e.target.value);
                }}
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {gatewayList.map(gw => (
                  <option key={gw} value={gw} style={{ background: "#0b1420", color: "#e5edf8" }}>{gw}</option>
                ))}
              </select>
            </div>

            <div className="selector">
              <small>MACHINE</small>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {filteredDevices.map((device) => (
                  <option
                    key={device.device_id}
                    value={device.device_id}
                    style={{ background: "#0b1420", color: "#e5edf8" }}
                  >
                    {device.device_id}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="refresh"
              onClick={loadDashboard}
            >
              <RefreshCw
                size={15}
                className={loading ? "rotate" : ""}
              />
              Refresh
            </button>

            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: "relative" }}
              >
                <Bell size={17} />
                {anomalies.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      background: "#ef4444",
                      color: "#ffffff",
                      fontSize: "9px",
                      fontWeight: "bold",
                      borderRadius: "50%",
                      width: "16px",
                      height: "16px",
                      display: "grid",
                      placeItems: "center"
                    }}
                  >
                    {anomalies.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "42px",
                    width: "320px",
                    background: "#0b1420",
                    border: "1px solid #203447",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    padding: "16px",
                    zIndex: 1000
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, color: "#e5edf8", fontSize: "14px" }}>System Notifications</h4>
                    <button
                      onClick={() => setShowNotifications(false)}
                      style={{ background: "none", border: 0, color: "#7892ad", cursor: "pointer", fontSize: "12px" }}
                    >
                      ✕
                    </button>
                  </div>

                  {anomalies.length === 0 ? (
                    <p style={{ color: "#617794", fontSize: "12px", margin: "12px 0" }}>No critical alert notifications.</p>
                  ) : (
                    <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                      {anomalies.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "8px 10px",
                            marginBottom: "8px",
                            background: "rgba(255, 159, 67, 0.08)",
                            border: "1px solid rgba(255, 159, 67, 0.2)",
                            borderRadius: "6px",
                            fontSize: "11px"
                          }}
                        >
                          <strong style={{ color: "#ff9f43", display: "block" }}>⚠️ Anomaly: {item.device_id}</strong>
                          <span style={{ color: "#a4b7cd" }}>Temp: {Number(item.temperature || 0).toFixed(1)}°C · Status: {item.status || "Warning"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      background: "#142536",
                      color: "#36c8ff",
                      border: "1px solid #203447",
                      padding: "6px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    Close Drawer
                  </button>
                </div>
              )}
            </div>
          </div>

        </header>

        {activePage === "Dashboard" ? (

          <>

            {/* KPI */}

            <section className="kpi-grid">

              <Kpi

                title="TOTAL DEVICES"

                value={filteredDevices.length}

                subtitle={selectedLocation === "ALL" ? "Registered assets" : `In ${selectedLocation}`}

                icon={<Server />}

              />

              <Kpi

                title="ASSETS ONLINE"

                value={onlineCount}

                subtitle="Live telemetry"

                icon={<Activity />}

                green

              />

              <Kpi

                title="ACTIVE ALERTS"

                value={filteredAnomalies.length}

                subtitle="Requires attention"

                icon={<AlertTriangle />}

                orange

              />

              <Kpi

                title="REGIONS"

                value={selectedLocation === "ALL" ? regions.length : 1}

                subtitle="Monitoring zones"

                icon={<Factory />}

                purple

              />

            </section>

            {/* MACHINE STATUS */}

            <section className="machine-card">

              <div>

                <span className="section-label">

                  MACHINE STATUS

                </span>

                <h2>

                  {selectedDevice || "No device selected"}

                </h2>

                <p>

                  {currentDevice?.device_type ||

                    "Industrial equipment"}

                  {"  •  "}

                  {currentDevice?.refinery_region ||

                    "Unknown region"}

                </p>

              </div>

              <div className="running">

                <span></span>

                {(

                  currentDevice?.status ||

                  "RUNNING"

                ).toUpperCase()}

              </div>

            </section>

            {/* SENSOR CARDS */}

            <section className="sensor-grid">

              <Sensor

                title="TEMPERATURE"

                value={`${temperature.toFixed(1)} °C`}

                icon={<Thermometer />}

                type="temperature"

              />

              <Sensor

                title="VIBRATION"

                value={`${vibration.toFixed(2)} mm/s`}

                icon={<Waves />}

                type="vibration"

              />

              <Sensor

                title="CURRENT POWER"

                value={`${current.toFixed(2)} A`}

                icon={<Zap />}

                type="power"

              />

              <Sensor

                title="RPM"

                value="1728"

                icon={<Gauge />}

                type="rpm"

              />

              <Sensor

                title="UPTIME"

                value="99.2%"

                icon={<Activity />}

                type="uptime"

              />

            </section>

            {/* CHARTS */}

            <section className="charts">

              <div className="panel chart-panel">

                <PanelTitle

                  label="TEMPERATURE"

                  title="Temperature Trend"

                />

                <ResponsiveContainer

                  width="100%"

                  height={290}

                >

                  <AreaChart data={chartData}>

                    <defs>

                      <linearGradient

                        id="temperatureGradient"

                        x1="0"

                        y1="0"

                        x2="0"

                        y2="1"

                      >

                        <stop

                          offset="0%"

                          stopColor="#d946ef"

                          stopOpacity={0.35}

                        />

                        <stop

                          offset="100%"

                          stopColor="#d946ef"

                          stopOpacity={0}

                        />

                      </linearGradient>

                    </defs>

                    <CartesianGrid

                      stroke="#172333"

                      vertical={false}

                    />

                    <XAxis

                      dataKey="time"

                      stroke="#526174"

                      tick={{ fontSize: 10 }}

                    />

                    <YAxis

                      stroke="#526174"

                      tick={{ fontSize: 10 }}

                    />

                    <Tooltip

                      contentStyle={{

                        background: "#0b1420",

                        border: "1px solid #263548",

                        borderRadius: "8px",

                      }}

                    />

                    <Area

                      type="monotone"

                      dataKey="temperature"

                      stroke="#d946ef"

                      strokeWidth={2.5}

                      fill="url(#temperatureGradient)"

                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

              <div className="panel chart-panel">

                <PanelTitle

                  label="POWER"

                  title="Current Consumption"

                />

                <ResponsiveContainer

                  width="100%"

                  height={290}

                >

                  <LineChart data={chartData}>

                    <CartesianGrid

                      stroke="#172333"

                      vertical={false}

                    />

                    <XAxis

                      dataKey="time"

                      stroke="#526174"

                      tick={{ fontSize: 10 }}

                    />

                    <YAxis

                      stroke="#526174"

                      tick={{ fontSize: 10 }}

                    />

                    <Tooltip

                      contentStyle={{

                        background: "#0b1420",

                        border: "1px solid #263548",

                        borderRadius: "8px",

                      }}

                    />

                    <Line

                      type="monotone"

                      dataKey="current"

                      stroke="#38bdf8"

                      strokeWidth={2}

                      dot={false}

                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </section>

            {/* BOTTOM */}

            <section className="bottom-grid">

              {/* ALERTS */}

              <div className="panel">

                <PanelTitle

                  label="ALERT CENTER"

                  title="Top Anomalies"

                />

                {anomalies.length === 0 ? (

                  <div className="empty">

                    <Activity size={20} />

                    <span>No active anomalies</span>

                  </div>

                ) : (

                  <div className="alert-list">

                    {anomalies.map((item) => (

                      <div

                        className="alert-row"

                        key={item.device_id}

                      >

                        <div className="warning-icon">

                          <AlertTriangle size={16} />

                        </div>

                        <div className="alert-info">

                          <strong>

                            {item.device_id}

                          </strong>

                          <small>

                            {item.device_type ||

                              "Industrial device"}

                          </small>

                        </div>

                        <div className="alert-value">

                          {Number(

                            item.temperature || 0

                          ).toFixed(1)}

                          °C

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

              {/* REGIONS */}

              <div className="panel">

                <PanelTitle

                  label="OPERATIONS"

                  title="Regional Overview"

                />

                <div className="regions">

                  {regions.map((region, index) => (

                    <div

                      className="region"

                      key={region.region || index}

                    >

                      <div className="region-name">

                        <span></span>

                        {region.region}

                      </div>

                      <div>

                        <small>DEVICES</small>

                        <strong>

                          {region.total_devices}

                        </strong>

                      </div>

                      <div>

                        <small>ONLINE</small>

                        <strong className="green">

                          {region.online_devices}

                        </strong>

                      </div>

                      <div>

                        <small>ALERTS</small>

                        <strong className="red">

                          {region.alert_devices}

                        </strong>

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </section>

          </>

        ) : (

          <PageContent
            activePage={activePage}
            devices={devices}
            anomalies={anomalies}
            regions={regions}
            selectedDevice={selectedDevice}
            setSelectedDevice={setSelectedDevice}
            loadDashboard={loadDashboard}
            setAnomalies={setAnomalies}
          />

        )}


        {activePage === "Moisture Quality" && (
          <section style={{ color: "#eaf4ff", paddingBottom: 24 }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ color: "#38bdf8", fontSize: 11, letterSpacing: 2 }}>
                QUALITY CONTROL / FACTORY SAMPLES
              </div>
              <h2 style={{ fontSize: 27, margin: "8px 0" }}>
                Moisture Quality Dashboard
              </h2>
              <p style={{ color: "#91a9bf", margin: 0 }}>
                Live sample readings · Automatically refreshed every 5 seconds
              </p>
            </div>

            {moistureError && (
              <div style={{ color: "#ff8585", marginBottom: 16 }}>
                Moisture API error: {moistureError}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 14,
                marginBottom: 20,
              }}
            >
              {[
                {
                  label: "TOTAL SAMPLES",
                  value: moistureTests.length,
                  color: "#38bdf8",
                  note: "Records loaded from database",
                },
                {
                  label: "AVERAGE MOISTURE",
                  value: `${averageMoisture.toFixed(2)}%`,
                  color: "#a78bfa",
                  note: "Across loaded samples",
                },
                {
                  label: "HIGHEST MOISTURE",
                  value: `${highestMoisture.toFixed(2)}%`,
                  color: "#fb923c",
                  note: "Highest recorded reading",
                },
                {
                  label: "LATEST READING",
                  value: latestMoisture
                    ? `${Number(latestMoisture.moisture_percentage).toFixed(2)}%`
                    : "—",
                  color: "#34d399",
                  note: latestMoisture?.sample_name || "No sample available",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#0b1725",
                    border: "1px solid #203447",
                    borderRadius: 12,
                    padding: 20,
                    borderTop: `3px solid ${item.color}`,
                  }}
                >
                  <div style={{ color: "#91a9bf", fontSize: 10, letterSpacing: 1.4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, margin: "12px 0" }}>
                    {item.value}
                  </div>
                  <div style={{ color: "#7892ad", fontSize: 12 }}>{item.note}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#0b1725",
                border: "1px solid #203447",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Moisture Trend Analysis</h3>
              <p style={{ color: "#91a9bf", fontSize: 12 }}>
                Moisture percentage for the 20 most recently recorded samples
              </p>

              {moistureChartData.length === 0 ? (
                <p>No moisture readings available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={moistureChartData}>
                    <CartesianGrid stroke="#203447" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="sample"
                      stroke="#91a9bf"
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#91a9bf"
                      tick={{ fontSize: 11 }}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Moisture"]}
                      contentStyle={{
                        background: "#101d2c",
                        border: "1px solid #203447",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      name="Moisture"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "#38bdf8" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div
              style={{
                background: "#0b1725",
                border: "1px solid #203447",
                borderRadius: 12,
                padding: 20,
                overflowX: "auto",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Recent Sample Records</h3>

              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Sample ID", "Sample Name", "Moisture", "Created At"].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: 12,
                            color: "#91a9bf",
                            borderBottom: "1px solid #203447",
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedMoistureTests.slice(0, 10).map((sample) => (
                    <tr key={sample.id}>
                      <td style={{ padding: 12, borderBottom: "1px solid #203447" }}>
                        {sample.id}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #203447" }}>
                        {sample.sample_name}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #203447" }}>
                        {Number(sample.moisture_percentage).toFixed(2)}%
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #203447" }}>
                        {sample.created_at
                          ? new Date(sample.created_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer>

          AXION TELEMETRY PLATFORM

          <span>

            FastAPI • PostgreSQL • React

          </span>

        </footer>

      </main>

    </div>

  );

}

/\* COMPONENTS \*/

function Kpi({

  title,

  value,

  subtitle,

  icon,

  green,

  orange,

  purple,

}) {

  return (

    <div

      className={`kpi ${green

          ? "green"

          : orange

            ? "orange"

            : purple

              ? "purple"

              : ""

        }`}

    >

      <div className="kpi-icon">

        {icon}

      </div>

      <div>

        <small>{title}</small>

        <strong>{value}</strong>

        <span>{subtitle}</span>

      </div>

    </div>

  );

}

function Sensor({

  title,

  value,

  icon,

  type,

}) {

  return (

    <div className="sensor">

      <div className={`sensor-icon ${type}`}>

        {icon}

      </div>

      <div className="sensor-title">

        {title}

      </div>

      <strong>

        {value}

      </strong>

      <div className="sensor-line">

        <span></span>

      </div>

    </div>

  );

}

function PageContent({
  activePage,
  devices,
  anomalies,
  regions,
  selectedDevice,
  setSelectedDevice,
  loadDashboard,
  setAnomalies,
}) {

  const panelStyle = {

    background: "#0b1420",

    border: "1px solid #263548",

    borderRadius: "12px",

    padding: "20px",

    marginBottom: "16px",

    color: "#dce7f5",

    overflowX: "auto",

  };

  if (activePage === "Factory Overview") {
    return <FactoryOverview API_URL={API_URL} loadDashboard={loadDashboard} />;
  }

  if (activePage === "Production Line") {
    return (
      <ProductionLineView
        API_URL={API_URL}
        devices={devices}
        setSelectedDevice={setSelectedDevice}
        loadDashboard={loadDashboard}
      />
    );
  }

  if (activePage === "Data Explorer") {

    return (

      <section style={panelStyle}>

        <h2>Data Explorer — Latest Telemetry</h2>

        <table style={{ width: "100%", textAlign: "left" }}>

          <thead>

            <tr>

              <th>Device</th>

              <th>Region</th>

              <th>Temperature</th>

              <th>Vibration</th>

              <th>Current</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {devices.map((device) => (

              <tr key={device.device_id}>

                <td>{device.device_id}</td>

                <td>{device.refinery_region}</td>

                <td>{Number(device.temperature || 0).toFixed(2)} °C</td>

                <td>{Number(device.vibration || 0).toFixed(2)} mm/s</td>

                <td>{Number(device.current || 0).toFixed(2)} A</td>

                <td>{device.status}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </section>

    );

  }

  if (activePage === "Alerts") {

    return (

      <section style={panelStyle}>

        <h2>Active Alerts</h2>

        {anomalies.length === 0 ? (

          <p>No anomalies returned by the API.</p>

        ) : (

          anomalies.map((item) => (

            <div key={item.device_id} style={{ padding: "12px 0" }}>

              ⚠️ <strong>{item.device_id}</strong>

              {" — "}{Number(item.temperature || 0).toFixed(1)} °C

              {" — "}{item.status || "Warning"}

            </div>

          ))

        )}

      </section>

    );

  }

  if (activePage === "Settings") {
    return (
      <SettingsPanel
        API_URL={API_URL}
        devices={devices}
        loadDashboard={loadDashboard}
        setAnomalies={setAnomalies}
      />
    );
  }

  return null;
}

function SettingsPanel({ API_URL, devices, loadDashboard, setAnomalies }) {
  const [activeTab, setActiveTab] = useState("general");
  const [apiUrlInput, setApiUrlInput] = useState(() => localStorage.getItem("axion_api_url") || API_URL);
  const [refreshRate, setRefreshRate] = useState(() => Number(localStorage.getItem("axion_refresh_rate")) || 5000);
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem("axion_auto_sync") !== "false");
  const [envMode, setEnvMode] = useState(() => localStorage.getItem("axion_env_mode") || "production");

  const [tempWarning, setTempWarning] = useState(() => Number(localStorage.getItem("axion_temp_warning")) || 85);
  const [tempCritical, setTempCritical] = useState(() => Number(localStorage.getItem("axion_temp_critical")) || 100);
  const [vibWarning, setVibWarning] = useState(() => Number(localStorage.getItem("axion_vib_warning")) || 6);
  const [vibCritical, setVibCritical] = useState(() => Number(localStorage.getItem("axion_vib_critical")) || 10);
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem("axion_sound_alerts") === "true");
  const [toastAlerts, setToastAlerts] = useState(() => localStorage.getItem("axion_toast_alerts") !== "false");
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem("axion_webhook_url") || "");

  const [tenantId, setTenantId] = useState(() => localStorage.getItem("axion_tenant_id") || "demo-tenant");
  const [gatewayId, setGatewayId] = useState(() => localStorage.getItem("axion_gateway_id") || "iot2050-office");
  const [newGatewayName, setNewGatewayName] = useState("");
  const [gatewayList, setGatewayList] = useState(() => {
    try {
      const saved = localStorage.getItem("axion_gateway_list");
      return saved ? JSON.parse(saved) : ["iot2050-office", "gateway-refinery-01", "gateway-factory-02"];
    } catch (e) {
      return ["iot2050-office", "gateway-refinery-01", "gateway-factory-02"];
    }
  });

  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [webhookStatus, setWebhookStatus] = useState("");
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("axion_audit_logs");
      return saved ? JSON.parse(saved) : [
        { id: 1, time: new Date().toLocaleTimeString(), event: "System configuration loaded", type: "info" },
        { id: 2, time: new Date().toLocaleTimeString(), event: `Backend environment connected (${API_URL})`, type: "success" }
      ];
    } catch (e) {
      return [
        { id: 1, time: new Date().toLocaleTimeString(), event: "System configuration loaded", type: "info" },
        { id: 2, time: new Date().toLocaleTimeString(), event: `Backend environment connected (${API_URL})`, type: "success" }
      ];
    }
  });

  const addLog = (event, type = "info") => {
    const newLog = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      event,
      type
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem("axion_audit_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveSettings = () => {
    localStorage.setItem("axion_api_url", apiUrlInput);
    localStorage.setItem("axion_refresh_rate", refreshRate);
    localStorage.setItem("axion_auto_sync", autoSync);
    localStorage.setItem("axion_env_mode", envMode);

    localStorage.setItem("axion_temp_warning", tempWarning);
    localStorage.setItem("axion_temp_critical", tempCritical);
    localStorage.setItem("axion_vib_warning", vibWarning);
    localStorage.setItem("axion_vib_critical", vibCritical);
    localStorage.setItem("axion_sound_alerts", soundAlerts);
    localStorage.setItem("axion_toast_alerts", toastAlerts);
    localStorage.setItem("axion_webhook_url", webhookUrl);

    localStorage.setItem("axion_tenant_id", tenantId);
    localStorage.setItem("axion_gateway_id", gatewayId);
    localStorage.setItem("axion_gateway_list", JSON.stringify(gatewayList));

    addLog("Configuration parameters updated and saved to local storage", "success");
    setSaveStatus("Settings saved successfully!");
    setTimeout(() => setSaveStatus(""), 3500);
  };

  const testPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    const start = performance.now();
    try {
      const res = await fetch(`${apiUrlInput}/dashboard/summary`);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingResult({ status: "ok", latency, timestamp: new Date().toLocaleTimeString() });
        addLog(`Backend Ping Successful: ${latency}ms latency`, "success");
      } else {
        setPingResult({ status: "error", latency, timestamp: new Date().toLocaleTimeString() });
        addLog(`Backend Ping Returned Error HTTP ${res.status}`, "danger");
      }
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      setPingResult({ status: "error", latency, timestamp: new Date().toLocaleTimeString() });
      addLog(`Ping Connection Failed: ${err.message}`, "danger");
    } finally {
      setIsPinging(false);
    }
  };

  const playTestAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      addLog("Test Alarm Sound Tone Played (880Hz Sawtooth)", "warning");
    } catch (e) {
      addLog("Audio alarm playback failed: Browser context blocked", "danger");
    }
  };

  const testWebhookDispatch = async () => {
    if (!webhookUrl) {
      setWebhookStatus("Please enter a Webhook URL first.");
      return;
    }
    setWebhookStatus("Dispatching alert test payload...");
    try {
      const payload = {
        event: "CRITICAL_TELEMETRY_ALERT",
        device_id: "CNC-001",
        metric: "temperature",
        value: 104.5,
        threshold: tempCritical,
        timestamp: new Date().toISOString()
      };
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors"
      });
      setWebhookStatus("Webhook dispatch payload sent successfully!");
      addLog(`Dispatched test Webhook notification to ${webhookUrl}`, "success");
    } catch (err) {
      setWebhookStatus(`Webhook Error: ${err.message}`);
      addLog(`Webhook Dispatch Failure: ${err.message}`, "danger");
    }
    setTimeout(() => setWebhookStatus(""), 4000);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(devices, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `axion_telemetry_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog(`Exported ${devices.length} device objects to JSON file`, "success");
  };

  const exportCSV = () => {
    if (!devices || devices.length === 0) {
      addLog("CSV Export Skipped: No active devices found", "warning");
      return;
    }
    const headers = ["device_id", "refinery_region", "temperature", "vibration", "current", "status"];
    const rows = devices.map(d => [
      d.device_id,
      d.refinery_region || "N/A",
      d.temperature || 0,
      d.vibration || 0,
      d.current || 0,
      d.status || "healthy"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `axion_telemetry_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addLog(`Exported ${devices.length} telemetry records to CSV file`, "success");
  };

  const simulateAnomalyTest = () => {
    const synthId = `ANOMALY-TEST-${Math.floor(Math.random() * 899 + 100)}`;
    const syntheticDevice = {
      device_id: synthId,
      refinery_region: "Zone-Alpha-Test",
      temperature: (103.5 + Math.random() * 12).toFixed(1),
      vibration: (12.4 + Math.random() * 4).toFixed(1),
      current: (19.1 + Math.random() * 2).toFixed(1),
      status: "critical"
    };
    if (setAnomalies) {
      setAnomalies(prev => [syntheticDevice, ...prev]);
    }
    addLog(`Simulated Anomaly Test event injected for ${synthId}`, "warning");
    if (soundAlerts) playTestAlarmSound();
  };

  const addGateway = () => {
    if (!newGatewayName.trim()) return;
    const updated = [...gatewayList, newGatewayName.trim()];
    setGatewayList(updated);
    localStorage.setItem("axion_gateway_list", JSON.stringify(updated));
    addLog(`Registered new gateway node: ${newGatewayName.trim()}`, "success");
    setNewGatewayName("");
  };

  const clearCacheAndReset = () => {
    if (window.confirm("Are you sure you want to reset all telemetry settings to defaults?")) {
      localStorage.clear();
      setApiUrlInput(API_URL);
      setRefreshRate(5000);
      setAutoSync(true);
      setEnvMode("production");
      setTempWarning(85);
      setTempCritical(100);
      setVibWarning(6);
      setVibCritical(10);
      setSoundAlerts(false);
      setToastAlerts(true);
      setWebhookUrl("");
      setTenantId("demo-tenant");
      setGatewayId("iot2050-office");
      addLog("System settings restored to default values", "warning");
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#050b12",
    border: "1px solid #1c2b3d",
    color: "#e5edf8",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginTop: "6px"
  };

  const labelStyle = {
    display: "block",
    color: "#8a9fbb",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    marginTop: "16px"
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #107299 0%, #0c5270 100%)",
    color: "#ffffff",
    border: "1px solid #1da1d6",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px"
  };

  const btnSecondary = {
    background: "#0c1826",
    color: "#a4b7cd",
    border: "1px solid #1c2d42",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px"
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "22px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Sliders size={24} color="#36c8ff" />
            Telemetry System Settings & Tools
          </h2>
          <p style={{ color: "#617794", margin: "6px 0 0 0", fontSize: "12px" }}>
            Manage environment connection, telemetry polling, alert bounds, gateway nodes, and diagnostic utilities.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {saveStatus && <span style={{ color: "#21e59b", fontSize: "12px", fontWeight: "600" }}>{saveStatus}</span>}
          <button style={btnPrimary} onClick={handleSaveSettings}>
            <Save size={16} /> Save Configurations
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #172638", paddingBottom: "12px", marginBottom: "24px" }}>
        {[
          { id: "general", label: "General & Network", icon: Database },
          { id: "thresholds", label: "Alert Rules & Thresholds", icon: ShieldAlert },
          { id: "gateways", label: "Gateways & Tenants", icon: Cpu },
          { id: "tools", label: "Diagnostics & Export Tools", icon: Download },
          { id: "logs", label: "System Audit Logs", icon: Terminal }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? "rgba(54, 200, 255, 0.12)" : "transparent",
                color: isActive ? "#36c8ff" : "#6c829e",
                border: isActive ? "1px solid rgba(54, 200, 255, 0.3)" : "1px solid transparent",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: isActive ? "600" : "500",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL & NETWORK */}
      {activeTab === "general" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#36c8ff", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={18} /> API & Server Endpoint
            </h3>

            <label style={labelStyle}>BACKEND SERVICE URL</label>
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <input
                type="text"
                value={apiUrlInput}
                onChange={e => setApiUrlInput(e.target.value)}
                style={inputStyle}
                placeholder="http://127.0.0.1:8000"
              />
              <button style={{ ...btnSecondary, marginTop: "6px", whiteSpace: "nowrap" }} onClick={testPing} disabled={isPinging}>
                <Radio size={14} className={isPinging ? "rotate" : ""} /> {isPinging ? "Pinging..." : "Test Ping"}
              </button>
            </div>

            {pingResult && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: pingResult.status === "ok" ? "rgba(33, 229, 155, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: pingResult.status === "ok" ? "1px solid rgba(33, 229, 155, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {pingResult.status === "ok" ? <CheckCircle2 color="#21e59b" size={18} /> : <XCircle color="#ef4444" size={18} />}
                  <span style={{ color: pingResult.status === "ok" ? "#21e59b" : "#ef4444", fontSize: "12px", fontWeight: "600" }}>
                    {pingResult.status === "ok" ? `Online (${pingResult.latency} ms latency)` : "Connection Failed"}
                  </span>
                </div>
                <span style={{ color: "#617794", fontSize: "10px" }}>Tested at {pingResult.timestamp}</span>
              </div>
            )}

            <label style={labelStyle}>ENVIRONMENT MODE</label>
            <select value={envMode} onChange={e => setEnvMode(e.target.value)} style={inputStyle}>
              <option value="production">Production Environment</option>
              <option value="staging">Staging / Testbed</option>
              <option value="development">Local Development</option>
              <option value="simulation">Telemetry Simulator</option>
            </select>
          </div>

          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#36c8ff", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <RefreshCw size={18} /> Telemetry Polling & Auto-Sync
            </h3>

            <label style={labelStyle}>AUTO-REFRESH FREQUENCY</label>
            <select value={refreshRate} onChange={e => setRefreshRate(Number(e.target.value))} style={inputStyle}>
              <option value={2000}>2 Seconds (Real-time Ultra)</option>
              <option value={5000}>5 Seconds (Standard Recommended)</option>
              <option value={10000}>10 Seconds (Low Bandwidth)</option>
              <option value={30000}>30 Seconds (Periodic Sync)</option>
              <option value={60000}>1 Minute (Batch Fetch)</option>
            </select>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px" }}>
              <div>
                <strong style={{ color: "#e5edf8", fontSize: "13px" }}>Enable Background Polling</strong>
                <p style={{ color: "#617794", margin: "2px 0 0 0", fontSize: "11px" }}>Automatically sync metrics with TimescaleDB</p>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={e => setAutoSync(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "#36c8ff", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALERT RULES & THRESHOLDS */}
      {activeTab === "thresholds" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#ff9f43", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Thermometer size={18} /> Temperature Limits (°C)
            </h3>

            <label style={labelStyle}>WARNING TEMPERATURE THRESHOLD: {tempWarning} °C</label>
            <input
              type="range"
              min="50"
              max="110"
              value={tempWarning}
              onChange={e => setTempWarning(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ff9f43", marginTop: "8px" }}
            />

            <label style={labelStyle}>CRITICAL TEMPERATURE THRESHOLD: {tempCritical} °C</label>
            <input
              type="range"
              min="70"
              max="150"
              value={tempCritical}
              onChange={e => setTempCritical(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ef4444", marginTop: "8px" }}
            />
          </div>

          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#ff9f43", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Waves size={18} /> Vibration Limits (mm/s)
            </h3>

            <label style={labelStyle}>WARNING VIBRATION THRESHOLD: {vibWarning} mm/s</label>
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={vibWarning}
              onChange={e => setVibWarning(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ff9f43", marginTop: "8px" }}
            />

            <label style={labelStyle}>CRITICAL VIBRATION THRESHOLD: {vibCritical} mm/s</label>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={vibCritical}
              onChange={e => setVibCritical(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ef4444", marginTop: "8px" }}
            />
          </div>

          <div className="panel" style={{ padding: "20px", gridColumn: "1 / -1" }}>
            <h3 style={{ color: "#36c8ff", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={18} /> Notification Dispatch & Audio Alarms
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={{ padding: "14px", background: "#050b12", border: "1px solid #1c2b3d", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#e5edf8", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {soundAlerts ? <Volume2 size={16} color="#36c8ff" /> : <VolumeX size={16} color="#617794" />} Audio Beep Alarm
                  </strong>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={e => setSoundAlerts(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#36c8ff", cursor: "pointer" }}
                  />
                </div>
                <button style={{ ...btnSecondary, marginTop: "12px", width: "100%", justifyContent: "center" }} onClick={playTestAlarmSound}>
                  Test Alarm Tone
                </button>
              </div>

              <div style={{ padding: "14px", background: "#050b12", border: "1px solid #1c2b3d", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#e5edf8", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Bell size={16} color="#36c8ff" /> Toast Notifications
                  </strong>
                  <input
                    type="checkbox"
                    checked={toastAlerts}
                    onChange={e => setToastAlerts(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#36c8ff", cursor: "pointer" }}
                  />
                </div>
                <p style={{ color: "#617794", fontSize: "10px", margin: "10px 0 0 0" }}>Display floating banner when warning triggers</p>
              </div>

              <div style={{ padding: "14px", background: "#050b12", border: "1px solid #1c2b3d", borderRadius: "8px" }}>
                <strong style={{ color: "#e5edf8", fontSize: "12px", display: "block", marginBottom: "6px" }}>WEBHOOK ENDPOINT</strong>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/..."
                  style={{ ...inputStyle, padding: "6px 10px", fontSize: "11px" }}
                />
                <button style={{ ...btnSecondary, marginTop: "8px", width: "100%", justifyContent: "center" }} onClick={testWebhookDispatch}>
                  Send Test Webhook
                </button>
                {webhookStatus && <div style={{ color: "#36c8ff", fontSize: "10px", marginTop: "6px" }}>{webhookStatus}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GATEWAYS & TENANTS */}
      {activeTab === "gateways" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#36c8ff", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Cpu size={18} /> Active Tenant & Gateway Context
            </h3>

            <label style={labelStyle}>TENANT IDENTIFIER</label>
            <input type="text" value={tenantId} onChange={e => setTenantId(e.target.value)} style={inputStyle} />

            <label style={labelStyle}>PRIMARY EDGE GATEWAY</label>
            <select value={gatewayId} onChange={e => setGatewayId(e.target.value)} style={inputStyle}>
              {gatewayList.map(gw => (
                <option key={gw} value={gw}>{gw}</option>
              ))}
            </select>
          </div>

          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#36c8ff", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Factory size={18} /> Register Gateway Node
            </h3>

            <label style={labelStyle}>NEW GATEWAY NODE NAME</label>
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <input
                type="text"
                value={newGatewayName}
                onChange={e => setNewGatewayName(e.target.value)}
                placeholder="e.g. gateway-plant-south"
                style={inputStyle}
              />
              <button style={{ ...btnPrimary, marginTop: "6px", whiteSpace: "nowrap" }} onClick={addGateway}>
                Add Node
              </button>
            </div>

            <div style={{ marginTop: "20px" }}>
              <label style={labelStyle}>REGISTERED NODES ({gatewayList.length})</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {gatewayList.map(node => (
                  <span
                    key={node}
                    style={{
                      background: "#050b12",
                      border: "1px solid #1c2b3d",
                      color: "#a4b7cd",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600"
                    }}
                  >
                    🔌 {node}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIAGNOSTICS & EXPORT TOOLS */}
      {activeTab === "tools" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#36c8ff", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Download size={18} /> Data Export Utilities
            </h3>

            <p style={{ color: "#617794", fontSize: "12px", marginBottom: "20px" }}>
              Download complete telemetry reports and device condition logs for off-line audit or analytics.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button style={btnPrimary} onClick={exportJSON}>
                <FileText size={16} /> Export JSON Data
              </button>
              <button style={{ ...btnSecondary, color: "#21e59b", borderColor: "rgba(33, 229, 155, 0.3)" }} onClick={exportCSV}>
                <Download size={16} /> Export CSV Report
              </button>
            </div>
          </div>

          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ color: "#ff9f43", margin: "0 0 16px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={18} /> Simulation & System Diagnostics
            </h3>

            <p style={{ color: "#617794", fontSize: "12px", marginBottom: "20px" }}>
              Run synthetic stress tests to verify real-time alert dispatch and system sound synthesizer.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button style={{ ...btnSecondary, color: "#ff9f43", borderColor: "rgba(255, 159, 67, 0.3)" }} onClick={simulateAnomalyTest}>
                <AlertTriangle size={16} /> Inject Anomaly Stress Test
              </button>
              <button style={{ ...btnSecondary, color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }} onClick={clearCacheAndReset}>
                <Trash2 size={16} /> Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "#36c8ff", margin: 0, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Terminal size={18} /> Interactive System Audit Logs
            </h3>
            <button
              style={{ ...btnSecondary, padding: "6px 12px", fontSize: "11px" }}
              onClick={() => {
                setAuditLogs([]);
                localStorage.removeItem("axion_audit_logs");
              }}
            >
              Clear Console Logs
            </button>
          </div>

          <div
            style={{
              background: "#03070d",
              border: "1px solid #142131",
              borderRadius: "8px",
              padding: "16px",
              fontFamily: "monospace",
              fontSize: "12px",
              maxHeight: "400px",
              overflowY: "auto"
            }}
          >
            {auditLogs.length === 0 ? (
              <div style={{ color: "#455973", textAlign: "center", padding: "20px" }}>No system audit logs recorded.</div>
            ) : (
              auditLogs.map(log => {
                const colorMap = {
                  success: "#21e59b",
                  danger: "#ef4444",
                  warning: "#ff9f43",
                  info: "#36c8ff"
                };
                return (
                  <div key={log.id} style={{ display: "flex", gap: "14px", padding: "4px 0", borderBottom: "1px solid #0b1521" }}>
                    <span style={{ color: "#50647e", width: "90px" }}>[{log.time}]</span>
                    <span style={{ color: colorMap[log.type] || "#36c8ff", fontWeight: "bold", width: "80px", textTransform: "uppercase" }}>
                      {log.type}
                    </span>
                    <span style={{ color: "#dce7f2", flex: 1 }}>{log.event}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelTitle({ label, title, children }) {

  return (

    <div style={{ marginBottom: "16px" }}>

      {label && (

        <div

          style={{

            color: "#7892ad",

            fontSize: "10px",

            letterSpacing: "2px",

            marginBottom: "8px",

          }}

        >

          {label}

        </div>

      )}

      <h3 style={{ color: "#e5edf8", margin: 0, fontSize: "16px" }}>

        {title}

      </h3>

      {children}

    </div>

  );

}

function ProductionLineView({ API_URL, devices, setSelectedDevice, loadDashboard }) {
  const [factories, setFactories] = useState([]);
  const [lines, setLines] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [modalType, setModalType] = useState(null);
  const [targetLineId, setTargetLineId] = useState(null);
  const [targetMachine, setTargetMachine] = useState(null);

  const [deviceId, setDeviceId] = useState("");
  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("CNC Machine");
  const [criticality, setCriticality] = useState("medium");

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError("");
      const facRes = await fetch(`${API_URL}/factories`);
      if (!facRes.ok) throw new Error("Failed to load factories");
      const facData = await facRes.json();
      setFactories(facData || []);

      const linePromises = (facData || []).map(f => fetch(`${API_URL}/factories/${f.factory_id}/lines`).then(r => r.json()));
      const linesNested = await Promise.all(linePromises);
      const allLines = linesNested.flat().filter(Boolean);
      setLines(allLines);

      const macPromises = allLines.map(l => fetch(`${API_URL}/production-lines/${l.line_id}/machines`).then(r => r.json()));
      const macsNested = await Promise.all(macPromises);
      const allMachines = macsNested.flat().filter(Boolean);
      setMachines(allMachines);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [API_URL]);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "addMachine") {
        const res = await fetch(`${API_URL}/production-lines/${targetLineId}/machines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId, machine_name: machineName, machine_type: machineType, criticality })
        });
        if (!res.ok) throw new Error("Failed to add machine to production line");
        showToast("New Machine added to Production Line successfully!");
      } else if (modalType === "editMachine") {
        const res = await fetch(`${API_URL}/machines/${targetMachine.machine_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId, machine_name: machineName, machine_type: machineType, criticality })
        });
        if (!res.ok) throw new Error("Failed to update machine");
        showToast("Machine updated successfully!");
      }
      setModalType(null);
      await loadAllData();
      if (loadDashboard) await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMachine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this machine from the production line?")) return;
    try {
      const res = await fetch(`${API_URL}/machines/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete machine");
      showToast("Machine removed from production line.");
      await loadAllData();
      if (loadDashboard) await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#050b12",
    border: "1px solid #1c2b3d",
    color: "#e5edf8",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    marginTop: "4px"
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #107299 0%, #0c5270 100%)",
    color: "#ffffff",
    border: "1px solid #1da1d6",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  };

  const btnSecondary = {
    background: "#0c1826",
    color: "#a4b7cd",
    border: "1px solid #1c2d42",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  };

  const btnDanger = {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  };

  return (
    <div className="panel" style={{ padding: 24, maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: "#ffffff", fontSize: 22, display: "flex", alignItems: "center", gap: 10 }}>
            <Server size={22} color="#36c8ff" />
            Production Lines & Machines Directory
          </h2>
          <p style={{ color: "#7892ad", margin: "4px 0 0 0", fontSize: 12 }}>
            Real-time status of all factory production lines and registered machine assets.
          </p>
        </div>

        <button style={btnSecondary} onClick={loadAllData}>
          <RefreshCw size={14} className={loading ? "rotate" : ""} /> Refresh Data
        </button>
      </div>

      {error && <p style={{ color: "#ff7777", background: "rgba(255, 119, 119, 0.1)", padding: 10, borderRadius: 6 }}>{error}</p>}
      {successMsg && <p style={{ color: "#21e59b", background: "rgba(33, 229, 155, 0.1)", padding: 10, borderRadius: 6 }}>{successMsg}</p>}

      {lines.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#52677d", background: "#050b12", borderRadius: 8 }}>
          No production lines registered in database yet. Go to <strong>Factory Overview</strong> tab to create location & production lines.
        </div>
      ) : (
        lines.map((line) => {
          const lineMachines = machines.filter(m => m.line_id === line.line_id);
          const factoryObj = factories.find(f => f.factory_id === line.factory_id);

          return (
            <div key={line.line_id} style={{ background: "#081320", border: "1px solid #17293d", borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #132233", paddingBottom: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ margin: 0, color: "#36c8ff", fontSize: 17 }}>{line.line_name}</h3>
                    <span style={{ background: "rgba(54, 200, 255, 0.1)", border: "1px solid rgba(54, 200, 255, 0.2)", color: "#36c8ff", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                      {line.line_code}
                    </span>
                    <span style={{ background: line.status === "active" ? "rgba(33, 229, 155, 0.12)" : "rgba(255, 159, 67, 0.12)", color: line.status === "active" ? "#21e59b" : "#ff9f43", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600, textTransform: "uppercase" }}>
                      ● {line.status}
                    </span>
                  </div>
                  <span style={{ color: "#5d738f", fontSize: 11, marginTop: 4, display: "block" }}>
                    Location: <strong>{factoryObj ? `${factoryObj.factory_name} (${factoryObj.location})` : "Factory #" + line.factory_id}</strong>
                  </span>
                </div>

                <button
                  style={btnPrimary}
                  onClick={() => {
                    setTargetLineId(line.line_id);
                    setDeviceId("");
                    setMachineName("");
                    setMachineType("CNC Machine");
                    setCriticality("medium");
                    setModalType("addMachine");
                  }}
                >
                  <Plus size={14} /> Add Machine to Line
                </button>
              </div>

              {lineMachines.length === 0 ? (
                <div style={{ padding: 16, color: "#4f657d", fontSize: 12, fontStyle: "italic" }}>
                  No machines assigned to this production line yet. Click <strong>"Add Machine to Line"</strong> button above to add one!
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {lineMachines.map((m) => {
                    const liveDevice = (devices || []).find(d => d.device_id === m.device_id);
                    const temp = liveDevice ? Number(liveDevice.temperature || 0).toFixed(1) : null;

                    return (
                      <div
                        key={m.machine_id}
                        style={{
                          background: "#040910",
                          border: "1px solid #142336",
                          borderRadius: 8,
                          padding: 14,
                          position: "relative"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <strong style={{ color: "#ffffff", fontSize: 14, display: "block" }}>{m.machine_name}</strong>
                            <span style={{ color: "#36c8ff", fontSize: 11, fontWeight: "600" }}>ID: {m.device_id}</span>
                            <span style={{ color: "#5d738f", fontSize: 11, marginLeft: 8 }}>· {m.machine_type}</span>
                          </div>

                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              textTransform: "uppercase",
                              background: m.criticality === "critical" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 159, 67, 0.15)",
                              color: m.criticality === "critical" ? "#ef4444" : "#ff9f43"
                            }}
                          >
                            {m.criticality}
                          </span>
                        </div>

                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #122133", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#8a9fbb" }}>
                            {temp ? `Temp: ${temp}°C` : "Registered Asset"}
                          </span>

                          <button
                            style={{ ...btnSecondary, padding: "3px 8px", fontSize: 10 }}
                            onClick={() => setSelectedDevice(m.device_id)}
                          >
                            Inspect Machine Live
                          </button>
                        </div>

                        <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                          <button
                            style={{ ...btnSecondary, padding: "4px 8px", fontSize: 10 }}
                            onClick={() => {
                              setTargetMachine(m);
                              setDeviceId(m.device_id);
                              setMachineName(m.machine_name);
                              setMachineType(m.machine_type);
                              setCriticality(m.criticality);
                              setModalType("editMachine");
                            }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            style={{ ...btnDanger, padding: "4px 8px", fontSize: 10 }}
                            onClick={() => handleDeleteMachine(m.machine_id)}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {(modalType === "addMachine" || modalType === "editMachine") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleSaveMachine} style={{ background: "#0b1624", border: "1px solid #20344a", padding: 24, borderRadius: 10, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#36c8ff" }}>{modalType === "addMachine" ? "Add Machine to Production Line" : "Edit Machine Details"}</h3>
              <button type="button" onClick={() => setModalType(null)} style={{ background: "none", border: 0, color: "#7892ad", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600 }}>DEVICE ID / SENSOR TAG</label>
            <input type="text" required value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. CNC-005, PUMP-003" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>MACHINE NAME</label>
            <input type="text" required value={machineName} onChange={(e) => setMachineName(e.target.value)} placeholder="e.g. Primary Hydraulic Compressor" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>MACHINE TYPE</label>
            <input type="text" required value={machineType} onChange={(e) => setMachineType(e.target.value)} placeholder="e.g. CNC Machine, Cooling Pump, Turbine" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>CRITICALITY LEVEL</label>
            <select value={criticality} onChange={(e) => setCriticality(e.target.value)} style={inputStyle}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" style={btnSecondary} onClick={() => setModalType(null)}>Cancel</button>
              <button type="submit" style={btnPrimary}><Save size={14} /> Save Machine</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FactoryOverview({ API_URL, loadDashboard }) {
  const [factories, setFactories] = useState([]);
  const [lines, setLines] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [modalType, setModalType] = useState(null);
  const [targetItem, setTargetItem] = useState(null);

  const [factoryCode, setFactoryCode] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [factoryLocation, setFactoryLocation] = useState("");

  const [lineCode, setLineCode] = useState("");
  const [lineName, setLineName] = useState("");
  const [lineStatus, setLineStatus] = useState("active");

  const [deviceId, setDeviceId] = useState("");
  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("CNC Machine");
  const [criticality, setCriticality] = useState("medium");
  const [targetLineId, setTargetLineId] = useState(null);

  const loadFactories = async () => {
    try {
      const res = await fetch(`${API_URL}/factories`);
      if (!res.ok) throw new Error("Factory API failed");
      const data = await res.json();
      setFactories(data || []);
      if (data.length && (!selectedFactory || !data.some(f => String(f.factory_id) === String(selectedFactory)))) {
        setSelectedFactory(String(data[0].factory_id));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadFactoryDetails = async () => {
    if (!selectedFactory) return;
    try {
      setError("");
      const lineRes = await fetch(`${API_URL}/factories/${selectedFactory}/lines`);
      if (!lineRes.ok) throw new Error("Production Lines API failed");
      const lineData = await lineRes.json();
      setLines(lineData || []);

      const results = await Promise.all(
        lineData.map(async (line) => {
          const res = await fetch(`${API_URL}/production-lines/${line.line_id}/machines`);
          if (!res.ok) return [];
          return await res.json();
        })
      );
      setMachines(results.flat());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadFactories();
  }, [API_URL]);

  useEffect(() => {
    loadFactoryDetails();
  }, [API_URL, selectedFactory]);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleSaveFactory = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "addFactory") {
        const res = await fetch(`${API_URL}/factories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ factory_code: factoryCode, factory_name: factoryName, location: factoryLocation })
        });
        if (!res.ok) throw new Error("Failed to add location/factory");
        showToast("New Location/Factory added successfully!");
      } else if (modalType === "editFactory") {
        const res = await fetch(`${API_URL}/factories/${targetItem.factory_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ factory_code: factoryCode, factory_name: factoryName, location: factoryLocation })
        });
        if (!res.ok) throw new Error("Failed to update factory");
        showToast("Factory updated successfully!");
      }
      setModalType(null);
      await loadFactories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFactory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this factory/location? All associated lines will be affected.")) return;
    try {
      const res = await fetch(`${API_URL}/factories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete factory");
      showToast("Factory location deleted successfully!");
      await loadFactories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveLine = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "addLine") {
        const res = await fetch(`${API_URL}/factories/${selectedFactory}/lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ line_code: lineCode, line_name: lineName, status: lineStatus })
        });
        if (!res.ok) throw new Error("Failed to add production line");
        showToast("Production Line added successfully!");
      } else if (modalType === "editLine") {
        const res = await fetch(`${API_URL}/production-lines/${targetItem.line_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ line_code: lineCode, line_name: lineName, status: lineStatus })
        });
        if (!res.ok) throw new Error("Failed to update production line");
        showToast("Production Line updated successfully!");
      }
      setModalType(null);
      await loadFactoryDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this production line?")) return;
    try {
      const res = await fetch(`${API_URL}/production-lines/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete production line");
      showToast("Production line deleted successfully!");
      await loadFactoryDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "addMachine") {
        const res = await fetch(`${API_URL}/production-lines/${targetLineId}/machines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId, machine_name: machineName, machine_type: machineType, criticality })
        });
        if (!res.ok) throw new Error("Failed to add machine");
        showToast("Machine added successfully!");
      } else if (modalType === "editMachine") {
        const res = await fetch(`${API_URL}/machines/${targetItem.machine_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId, machine_name: machineName, machine_type: machineType, criticality })
        });
        if (!res.ok) throw new Error("Failed to update machine");
        showToast("Machine updated successfully!");
      }
      setModalType(null);
      await loadFactoryDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMachine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this machine?")) return;
    try {
      const res = await fetch(`${API_URL}/machines/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete machine");
      showToast("Machine deleted successfully!");
      await loadFactoryDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeFactoryObj = factories.find(f => String(f.factory_id) === String(selectedFactory));

  const inputStyle = {
    width: "100%",
    background: "#050b12",
    border: "1px solid #1c2b3d",
    color: "#e5edf8",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    marginTop: "4px"
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #107299 0%, #0c5270 100%)",
    color: "#ffffff",
    border: "1px solid #1da1d6",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  };

  const btnSecondary = {
    background: "#0c1826",
    color: "#a4b7cd",
    border: "1px solid #1c2d42",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  };

  const btnDanger = {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  };

  return (
    <div className="panel" style={{ padding: 24, maxWidth: 1200 }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: "#ffffff", fontSize: 22, display: "flex", alignItems: "center", gap: 10 }}>
            <Factory size={22} color="#36c8ff" />
            Factory & Location Management
          </h2>
          <p style={{ color: "#7892ad", margin: "4px 0 0 0", fontSize: 12 }}>
            Manage industrial locations, production lines, and monitored machine assets in real-time.
          </p>
        </div>

        <button
          style={btnPrimary}
          onClick={() => {
            setFactoryCode("");
            setFactoryName("");
            setFactoryLocation("");
            setModalType("addFactory");
          }}
        >
          <Plus size={15} /> Add New Location / Factory
        </button>
      </div>

      {error && <p style={{ color: "#ff7777", background: "rgba(255, 119, 119, 0.1)", padding: 10, borderRadius: 6 }}>{error}</p>}
      {successMsg && <p style={{ color: "#21e59b", background: "rgba(33, 229, 155, 0.1)", padding: 10, borderRadius: 6 }}>{successMsg}</p>}

      {/* Select Location Dropdown & Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#06111d", padding: "14px 18px", borderRadius: 8, border: "1px solid #162536", marginBottom: 20 }}>
        <label htmlFor="factory-select" style={{ color: "#8a9fbb", fontSize: 12, fontWeight: 600 }}>SELECT LOCATION / FACTORY:</label>
        <select
          id="factory-select"
          value={selectedFactory}
          onChange={(e) => setSelectedFactory(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: 260, marginTop: 0 }}
        >
          {factories.map((factory) => (
            <option key={factory.factory_id} value={factory.factory_id}>
              {factory.factory_name} — ({factory.factory_code}) [{factory.location}]
            </option>
          ))}
        </select>

        {activeFactoryObj && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              style={btnSecondary}
              onClick={() => {
                setTargetItem(activeFactoryObj);
                setFactoryCode(activeFactoryObj.factory_code);
                setFactoryName(activeFactoryObj.factory_name);
                setFactoryLocation(activeFactoryObj.location);
                setModalType("editFactory");
              }}
            >
              <Edit3 size={13} /> Edit Location
            </button>

            <button
              style={btnDanger}
              onClick={() => handleDeleteFactory(activeFactoryObj.factory_id)}
            >
              <Trash2 size={13} /> Delete Location
            </button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginTop: 16, marginBottom: 24 }}>
        <div className="panel" style={{ padding: 16 }}>
          <p style={{ color: "#7892ad", fontSize: 11, margin: 0 }}>PRODUCTION LINES</p>
          <h2 style={{ color: "#36c8ff", margin: "6px 0 0 0" }}>{lines.length}</h2>
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <p style={{ color: "#7892ad", fontSize: 11, margin: 0 }}>REGISTERED MACHINES</p>
          <h2 style={{ color: "#21e59b", margin: "6px 0 0 0" }}>{machines.length}</h2>
        </div>
      </div>

      {/* Production Lines Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: "#e5edf8" }}>Production Lines & Machines</h3>
        {selectedFactory && (
          <button
            style={btnSecondary}
            onClick={() => {
              setLineCode("");
              setLineName("");
              setLineStatus("active");
              setModalType("addLine");
            }}
          >
            <PlusCircle size={14} /> Add Production Line
          </button>
        )}
      </div>

      {lines.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "#52677d", background: "#050b12", borderRadius: 8, border: "1px solid #142131" }}>
          No production lines registered for this location. Click <strong>"Add Production Line"</strong> above to create one.
        </div>
      ) : (
        lines.map((line) => {
          const lineMachines = machines.filter((m) => m.line_id === line.line_id);
          return (
            <div
              key={line.line_id}
              className="panel"
              style={{ padding: 20, marginTop: 16, background: "#081320", border: "1px solid #17293d" }}
            >
              {/* Line Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #132233", paddingBottom: 12, marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: "#36c8ff", fontSize: 16 }}>{line.line_name}</h3>
                  <span style={{ color: "#6c829e", fontSize: 11 }}>Code: {line.line_code} · Status: <strong style={{ color: line.status === "active" ? "#21e59b" : "#ff9f43" }}>{line.status}</strong></span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={btnSecondary}
                    onClick={() => {
                      setTargetLineId(line.line_id);
                      setDeviceId("");
                      setMachineName("");
                      setMachineType("CNC Machine");
                      setCriticality("medium");
                      setModalType("addMachine");
                    }}
                  >
                    <Plus size={13} /> Add Machine
                  </button>

                  <button
                    style={btnSecondary}
                    onClick={() => {
                      setTargetItem(line);
                      setLineCode(line.line_code);
                      setLineName(line.line_name);
                      setLineStatus(line.status);
                      setModalType("editLine");
                    }}
                  >
                    <Edit3 size={13} /> Edit Line
                  </button>

                  <button
                    style={btnDanger}
                    onClick={() => handleDeleteLine(line.line_id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Machines List */}
              {lineMachines.length === 0 ? (
                <div style={{ padding: "10px 0", color: "#4f657d", fontSize: 12 }}>No machines added to this line yet.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {lineMachines.map((machine) => (
                    <div
                      key={machine.machine_id}
                      style={{
                        background: "#040910",
                        border: "1px solid #142336",
                        borderRadius: 8,
                        padding: 12,
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ color: "#e5edf8", fontSize: 13, display: "block" }}>{machine.machine_name}</strong>
                        <span style={{ color: "#5d738f", fontSize: 11 }}>
                          ID: {machine.device_id} · {machine.machine_type}
                        </span>
                        <span style={{ display: "block", color: machine.criticality === "critical" ? "#ef4444" : "#ff9f43", fontSize: 10, marginTop: 2, fontWeight: 600 }}>
                          Criticality: {machine.criticality?.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          style={{ ...btnSecondary, padding: 4 }}
                          onClick={() => {
                            setTargetItem(machine);
                            setDeviceId(machine.device_id);
                            setMachineName(machine.machine_name);
                            setMachineType(machine.machine_type);
                            setCriticality(machine.criticality);
                            setModalType("editMachine");
                          }}
                        >
                          <Edit3 size={12} />
                        </button>

                        <button
                          style={{ ...btnDanger, padding: 4 }}
                          onClick={() => handleDeleteMachine(machine.machine_id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* --- FORM MODALS --- */}

      {/* 1. FACTORY MODAL */}
      {(modalType === "addFactory" || modalType === "editFactory") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleSaveFactory} style={{ background: "#0b1624", border: "1px solid #20344a", padding: 24, borderRadius: 10, width: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#36c8ff" }}>{modalType === "addFactory" ? "Add Location / Factory" : "Edit Location / Factory"}</h3>
              <button type="button" onClick={() => setModalType(null)} style={{ background: "none", border: 0, color: "#7892ad", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600 }}>FACTORY CODE</label>
            <input type="text" required value={factoryCode} onChange={(e) => setFactoryCode(e.target.value)} placeholder="e.g. FAC-PUNE-01" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>FACTORY NAME</label>
            <input type="text" required value={factoryName} onChange={(e) => setFactoryName(e.target.value)} placeholder="e.g. Pune Manufacturing Facility" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>LOCATION / CITY</label>
            <input type="text" required value={factoryLocation} onChange={(e) => setFactoryLocation(e.target.value)} placeholder="e.g. Pune, India" style={inputStyle} />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" style={btnSecondary} onClick={() => setModalType(null)}>Cancel</button>
              <button type="submit" style={btnPrimary}><Save size={14} /> Save Location</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. PRODUCTION LINE MODAL */}
      {(modalType === "addLine" || modalType === "editLine") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleSaveLine} style={{ background: "#0b1624", border: "1px solid #20344a", padding: 24, borderRadius: 10, width: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#36c8ff" }}>{modalType === "addLine" ? "Add Production Line" : "Edit Production Line"}</h3>
              <button type="button" onClick={() => setModalType(null)} style={{ background: "none", border: 0, color: "#7892ad", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600 }}>LINE CODE</label>
            <input type="text" required value={lineCode} onChange={(e) => setLineCode(e.target.value)} placeholder="e.g. LINE-BOILER-01" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>LINE NAME</label>
            <input type="text" required value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder="e.g. Primary Assembly Line A" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>STATUS</label>
            <select value={lineStatus} onChange={(e) => setLineStatus(e.target.value)} style={inputStyle}>
              <option value="active">active</option>
              <option value="maintenance">maintenance</option>
              <option value="offline">offline</option>
            </select>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" style={btnSecondary} onClick={() => setModalType(null)}>Cancel</button>
              <button type="submit" style={btnPrimary}><Save size={14} /> Save Line</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. MACHINE MODAL */}
      {(modalType === "addMachine" || modalType === "editMachine") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleSaveMachine} style={{ background: "#0b1624", border: "1px solid #20344a", padding: 24, borderRadius: 10, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#36c8ff" }}>{modalType === "addMachine" ? "Add Machine / Device" : "Edit Machine / Device"}</h3>
              <button type="button" onClick={() => setModalType(null)} style={{ background: "none", border: 0, color: "#7892ad", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600 }}>DEVICE ID</label>
            <input type="text" required value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. CNC-005" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>MACHINE NAME</label>
            <input type="text" required value={machineName} onChange={(e) => setMachineName(e.target.value)} placeholder="e.g. High Speed Milling Machine" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>MACHINE TYPE</label>
            <input type="text" required value={machineType} onChange={(e) => setMachineType(e.target.value)} placeholder="e.g. CNC Machine, Compressor, Turbine" style={inputStyle} />

            <label style={{ color: "#8a9fbb", fontSize: 11, fontWeight: 600, marginTop: 12, display: "block" }}>CRITICALITY LEVEL</label>
            <select value={criticality} onChange={(e) => setCriticality(e.target.value)} style={inputStyle}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" style={btnSecondary} onClick={() => setModalType(null)}>Cancel</button>
              <button type="submit" style={btnPrimary}><Save size={14} /> Save Machine</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;