from sqlalchemy.orm import Session
from backend.app.database.connection import SessionLocal, Base, engine
from backend.app.models.models import User, Machine, ReferenceConfiguration, CurrentConfiguration, DiagnosticResult, Report, ActivityLog
from backend.app.utils.security import get_password_hash
from backend.app.diagnostic_engine.engine import DiagnosticEngine
from backend.app.llm.service import LLMService
import datetime
import os

def seed_database():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Clear existing data
        db.query(ActivityLog).delete()
        db.query(Report).delete()
        db.query(DiagnosticResult).delete()
        db.query(CurrentConfiguration).delete()
        db.query(ReferenceConfiguration).delete()
        db.query(Machine).delete()
        db.query(User).delete()
        db.commit()

        print("Cleared database...")

        # 1. Seed Users
        users = [
            User(employee_id="EMP-ADMIN01", username="John Administrator", role="Administrator", password_hash=get_password_hash("admin123"), email="admin@cat-diagnostics.com"),
            User(employee_id="EMP-ENG01", username="Sarah Engineer", role="Maintenance Engineer", password_hash=get_password_hash("eng123"), email="engineer@cat-diagnostics.com"),
            User(employee_id="EMP-OP01", username="Dave Operator", role="Operator", password_hash=get_password_hash("op123"), email="operator@cat-diagnostics.com"),
            User(employee_id="EMP-SUP01", username="Helen Supervisor", role="Supervisor", password_hash=get_password_hash("sup123"), email="workwiththarun@gmail.com"),
        ]
        db.add_all(users)
        db.commit()
        print("Seeded Users...")

        # 2. Define configuration data for 5 machines
        machines_data = [
            # Machine 1: Excavator - Warning (RAM and PLC version mismatched)
            {
                "machine_id": "CAT-HEX-320",
                "name": "CAT Hydraulic Excavator",
                "manufacturer": "Caterpillar Inc.",
                "category": "CAT Hydraulic Excavator",
                "model": "320-GC",
                "status": "Connected",
                "ref_config": {
                    "firmware": "v4.2.1-lts",
                    "plc_version": "v3.12-revB",
                    "cpu": "Intel Atom E3950",
                    "ram": "8GB DDR3",
                    "storage": "64GB SSD",
                    "communication_ports": ["USB", "COM1", "COM2", "Ethernet"],
                    "installed_modules": ["Analog Input", "Digital IO", "CAN Bus controller"],
                    "sensor_count": 12
                },
                "cur_config": {
                    "firmware": "v4.2.1-lts",
                    "plc_version": "v3.10-revA",  # Mismatch (Warning)
                    "cpu": "Intel Atom E3950",
                    "ram": "4GB DDR3",             # Mismatch (Warning)
                    "storage": "64GB SSD",
                    "communication_ports": ["USB", "COM1", "COM2", "Ethernet"],
                    "installed_modules": ["Analog Input", "Digital IO", "CAN Bus controller"],
                    "sensor_count": 12,
                    "temperature": 52.4,
                    "power_status": "Stable"
                }
            },
            # Machine 2: Wheel Loader - Healthy
            {
                "machine_id": "CAT-WLD-950",
                "name": "CAT Wheel Loader",
                "manufacturer": "Caterpillar Inc.",
                "category": "CAT Wheel Loader",
                "model": "950-GC",
                "status": "Connected",
                "ref_config": {
                    "firmware": "v2.8.5",
                    "plc_version": "v1.88",
                    "cpu": "ARM Cortex-A72",
                    "ram": "2GB LPDDR4",
                    "storage": "16GB eMMC",
                    "communication_ports": ["COM1", "Ethernet"],
                    "installed_modules": ["Analog Input", "Digital IO"],
                    "sensor_count": 8
                },
                "cur_config": {
                    "firmware": "v2.8.5",
                    "plc_version": "v1.88",
                    "cpu": "ARM Cortex-A72",
                    "ram": "2GB LPDDR4",
                    "storage": "16GB eMMC",
                    "communication_ports": ["COM1", "Ethernet"],
                    "installed_modules": ["Analog Input", "Digital IO"],
                    "sensor_count": 8,
                    "temperature": 44.8,
                    "power_status": "Stable"
                }
            },
            # Machine 3: Bulldozer - Warning (Firmware version mismatched, Sensor Count differs)
            {
                "machine_id": "CAT-BDZ-D6",
                "name": "CAT Bulldozer",
                "manufacturer": "Caterpillar Inc.",
                "category": "CAT Bulldozer",
                "model": "D6-LGP",
                "status": "Connected",
                "ref_config": {
                    "firmware": "v6.1.0-build22",
                    "plc_version": "v5.0.1",
                    "cpu": "AMD G-Series GX-412",
                    "ram": "4GB DDR3",
                    "storage": "32GB mSATA",
                    "communication_ports": ["USB", "COM1", "Ethernet", "Modbus-RTU"],
                    "installed_modules": ["Analog Input", "CAN Bus controller", "GPS receiver"],
                    "sensor_count": 16
                },
                "cur_config": {
                    "firmware": "v5.9.0-build11",  # Mismatch (Critical FW change)
                    "plc_version": "v5.0.1",
                    "cpu": "AMD G-Series GX-412",
                    "ram": "4GB DDR3",
                    "storage": "32GB mSATA",
                    "communication_ports": ["USB", "COM1", "Ethernet", "Modbus-RTU"],
                    "installed_modules": ["Analog Input", "CAN Bus controller", "GPS receiver"],
                    "sensor_count": 14,            # Mismatch (Warning)
                    "temperature": 68.2,
                    "power_status": "Stable"
                }
            },
            # Machine 4: Motor Grader - Healthy (Disconnected state)
            {
                "machine_id": "CAT-MGD-140",
                "name": "CAT Motor Grader",
                "manufacturer": "Caterpillar Inc.",
                "category": "CAT Motor Grader",
                "model": "140-AWD",
                "status": "Disconnected",
                "ref_config": {
                    "firmware": "v3.3.4",
                    "plc_version": "v2.1",
                    "cpu": "Cortex-M7",
                    "ram": "1MB SRAM",
                    "storage": "8MB Flash",
                    "communication_ports": ["COM1", "CAN1"],
                    "installed_modules": ["Digital IO"],
                    "sensor_count": 6
                },
                "cur_config": {
                    "firmware": "v3.3.4",
                    "plc_version": "v2.1",
                    "cpu": "Cortex-M7",
                    "ram": "1MB SRAM",
                    "storage": "8MB Flash",
                    "communication_ports": ["COM1", "CAN1"],
                    "installed_modules": ["Digital IO"],
                    "sensor_count": 6,
                    "temperature": 32.5,
                    "power_status": "Stable"
                }
            },
            # Machine 5: Diesel Generator - Fault (Critical Mismatches + High Temperature + Low Voltage)
            {
                "machine_id": "CAT-GEN-C175",
                "name": "CAT Diesel Generator",
                "manufacturer": "Caterpillar Inc.",
                "category": "CAT Diesel Generator",
                "model": "C175-16",
                "status": "Connected",
                "ref_config": {
                    "firmware": "v9.4.0",
                    "plc_version": "v8.32",
                    "cpu": "Intel Core i3-7100U",
                    "ram": "16GB DDR4",
                    "storage": "128GB SSD",
                    "communication_ports": ["USB", "COM1", "COM2", "Ethernet", "Modbus-TCP", "Profibus"],
                    "installed_modules": ["Analog Input", "Digital IO", "CAN Bus controller", "Power Logger Card"],
                    "sensor_count": 24
                },
                "cur_config": {
                    "firmware": "v9.0.2",          # Mismatch (Critical FW)
                    "plc_version": "v8.00",          # Mismatch (Warning)
                    "cpu": "Intel Pentium 4415U",    # Mismatch (Critical CPU)
                    "ram": "8GB DDR4",             # Mismatch (Warning)
                    "storage": "128GB SSD",
                    "communication_ports": ["USB", "COM1", "Ethernet", "Modbus-TCP"], # Missing COM2 & Profibus (Critical)
                    "installed_modules": ["Analog Input", "Digital IO", "CAN Bus controller"], # Missing Power Logger Card (Critical)
                    "sensor_count": 20,            # Mismatch (Warning)
                    "temperature": 94.5,            # Telemetry critical temperature (>90)
                    "power_status": "Low Voltage"   # Telemetry critical power status
                }
            }
        ]

        for item in machines_data:
            machine = Machine(
                machine_id=item["machine_id"],
                name=item["name"],
                manufacturer=item["manufacturer"],
                category=item["category"],
                model=item["model"],
                status=item["status"]
            )
            db.add(machine)
            db.flush()  # to make sure machine matches can map to child reference config tables

            ref = ReferenceConfiguration(
                machine_id=machine.machine_id,
                firmware=item["ref_config"]["firmware"],
                plc_version=item["ref_config"]["plc_version"],
                cpu=item["ref_config"]["cpu"],
                ram=item["ref_config"]["ram"],
                storage=item["ref_config"]["storage"],
                communication_ports=item["ref_config"]["communication_ports"],
                installed_modules=item["ref_config"]["installed_modules"],
                sensor_count=item["ref_config"]["sensor_count"]
            )
            db.add(ref)

            cur = CurrentConfiguration(
                machine_id=machine.machine_id,
                firmware=item["cur_config"]["firmware"],
                plc_version=item["cur_config"]["plc_version"],
                cpu=item["cur_config"]["cpu"],
                ram=item["cur_config"]["ram"],
                storage=item["cur_config"]["storage"],
                communication_ports=item["cur_config"]["communication_ports"],
                installed_modules=item["cur_config"]["installed_modules"],
                sensor_count=item["cur_config"]["sensor_count"],
                temperature=item["cur_config"]["temperature"],
                power_status=item["cur_config"]["power_status"]
            )
            db.add(cur)
            db.commit()

            # Run initial diagnostics on connected machines to seed history
            if machine.status == "Connected":
                diag_data = DiagnosticEngine.run_diagnostics(item["ref_config"], item["cur_config"])
                diag_res = DiagnosticResult(
                    machine_id=machine.machine_id,
                    timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                    status=diag_data["status"],
                    health_score=diag_data["health_score"],
                    details=diag_data,
                    notes=f"Auto-generated check for model {machine.model}."
                )
                db.add(diag_res)
                db.commit()

                # Add report for failed/warning ones
                if diag_res.status in ["Warning", "Fault"]:
                    ai_analysis = LLMService.analyze_diagnostics(
                        {"name": machine.name, "model": machine.model, "category": machine.category, "manufacturer": machine.manufacturer},
                        item["ref_config"],
                        item["cur_config"],
                        diag_data
                    )
                    
                    # Create report folder
                    report_dir = os.path.join("backend", "static", "reports")
                    os.makedirs(report_dir, exist_ok=True)
                    report_filename = f"report_{machine.machine_id}_{diag_res.id}.pdf"
                    report_path = os.path.join(report_dir, report_filename)
                    
                    from backend.app.reports.generator import ReportGenerator
                    ReportGenerator.generate_pdf(
                        file_path=report_path,
                        machine_info={"name": machine.name, "model": machine.model, "category": machine.category, "manufacturer": machine.manufacturer, "machine_id": machine.machine_id},
                        reference_config=item["ref_config"],
                        current_config=item["cur_config"],
                        diagnostic_result=diag_data,
                        llm_analysis=ai_analysis,
                        engineer_name="Sarah Engineer"
                    )

                    report_obj = Report(
                        diagnostic_result_id=diag_res.id,
                        title=f"Diagnostic Report: {machine.name} Mismatches",
                        file_path=f"/static/reports/{report_filename}",
                        engineer_id=2, # Sarah Engineer
                        metadata_json=ai_analysis
                    )
                    db.add(report_obj)
                    db.commit()

        # Seed activity logs
        logs = [
            ActivityLog(employee_id="EMP-ADMIN01", action="Login", details="Admin login completed successfully."),
            ActivityLog(employee_id="EMP-ENG01", action="Login", details="Maintenance Engineer logged into terminal."),
            ActivityLog(employee_id="EMP-ENG01", action="Machine Connected", details="Established simulated interface with CAT-HEX-320."),
            ActivityLog(employee_id="EMP-ENG01", action="Diagnostic Started", details="Triggered automated check on CAT-HEX-320."),
            ActivityLog(employee_id="EMP-ENG01", action="Diagnostic Completed", details="Diagnostics completed. Status: Warning, Score: 70."),
            ActivityLog(employee_id="EMP-ENG01", action="LLM Analysis Completed", details="Generated maintenance recommendations via diagnostics LLM."),
            ActivityLog(employee_id="EMP-ENG01", action="Report Generated", details="Compiled final PDF report for CAT-HEX-320.")
        ]
        db.add_all(logs)
        db.commit()

        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
