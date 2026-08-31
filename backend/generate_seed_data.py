import json
import random

# 1. Wards Data (ALL 85 Wards & 22 Municipal Zones of Indore)
sector_names = [
    "Rajwada & Central Market", "Vijay Nagar Sector A-C", "Palasia & Greater Kailash", "Bhawarkua & DAVV Campus",
    "Rau & Transport Nagar", "Sudama Nagar & Annapurna", "Chandan Nagar & Dhar Road", "Banganga & Sanwer Road",
    "Pardesipura & Kulkarni Nagar", "Khajrana & Bypass Corridor", "Sukhlia & Sant Ravidas Sector", "LIG Colony & Press Complex",
    "Nanda Nagar & ITI Sector", "Rajendra Nagar & Cat Road", "Silicon City Peripheral Area", "Musakhedi & Mayur Nagar",
    "Khandwa Road & Tejaji Nagar", "Bypass South & Ralamandal", "Malwa Mill & Patnipura", "Airport Road & Kalani Nagar",
    "Super Corridor West", "Bada Ganpati & MOG Lines", "Snehlata Ganj & Vallabh Nagar", "Manorama Ganj & Geeta Bhawan"
]

indore_wards = []
for w_num in range(1, 86):
    w_id = f"ward_{w_num}"
    zone_num = ((w_num - 1) % 22) + 1
    zone_name = f"Zone {zone_num}"
    
    if w_num == 1:
        w_name = "Rajwada & Central Market"
    elif w_num == 14:
        w_name = "Rajendra Nagar & Cat Road"
    elif w_num == 15:
        w_name = "Silicon City Peripheral Area"
    elif w_num == 27:
        w_name = "Vijay Nagar Sector A-C"
    elif w_num == 40:
        w_name = "Khajrana Main & Shaheed Bhagat Singh Sector"
    elif w_num == 52:
        w_name = "Musakhedi, Mayur Nagar & Ring Road Sector"
    else:
        name_idx = (w_num - 1) % len(sector_names)
        w_name = f"{sector_names[name_idx]}"

    lat_val = round(22.6400 + ((w_num * 17) % 140) * 0.001, 4)
    lng_val = round(75.8000 + ((w_num * 23) % 140) * 0.001, 4)
    
    indore_wards.append({
        "id": w_id,
        "name": f"Ward {w_num} — {w_name}",
        "zone": zone_name,
        "lat": lat_val,
        "lng": lng_val,
        "population": 25000 + (w_num * 350) % 25000,
        "poverty_rate": round(0.15 + (w_num % 40) * 0.01, 2),
        "literacy_rate": round(0.65 + (w_num % 30) * 0.01, 2),
        "infra_score": 30 + (w_num * 7) % 65,
        "budget_allocated": (w_num * 1200000) % 25000000
    })

# Write wards.json
with open(r"c:\Users\harsh parmar\Desktop\nagarmitra-dpi\backend\seed_data\indore_wards.json", "w", encoding="utf-8") as f:
    json.dump(indore_wards, f, indent=2, ensure_ascii=False)

# 2. Complaints Data (High density in Ward 14 & 15 for drainage hotspot)
complaints = []
categories = ["Sanitation & Drainage", "Water Supply", "Roads & Infrastructure", "Electricity & Streetlights", "Healthcare", "Education"]

samples_hnd = [
    ("Bhaiyaji, humare ward me paani ka nala beh raha hai, bacche bimar ho rahe hain, sadak poori toot gayi hai!", "Sanitation & Drainage", "Critical", True, 22.6812, 75.8261),
    ("Gutter ka ganda paani gharon ke samne bhara hai 15 din se, koi sunwayi nahi ho rahi.", "Sanitation & Drainage", "Critical", True, 22.6825, 75.8245),
    ("Monsoon me nala overflow ho gaya hai, dengue ka khatra badh raha hai.", "Sanitation & Drainage", "High", True, 22.6805, 75.8270),
    ("Main road par nale ki patti tut gayi hai, do bike wale gir gaye hain.", "Sanitation & Drainage", "Critical", False, 22.6798, 75.8239),
    ("Peene ke paani ki pipeline aur sewer line mix ho chuki hai, ganda paani aa raha hai.", "Water Supply", "Critical", True, 22.6830, 75.8280),
    ("Bypass ke pass lighting nahi hai, raat ko accident hote hain.", "Electricity & Streetlights", "High", False, 22.6660, 75.8165),
    ("Primary Health Sub-centre me doctor nahi aate aur dawayi khatam hai.", "Healthcare", "High", True, 22.6645, 75.8140),
    ("Industrial area me sadak me bade bade gaddhe hain, truck phans rahe hain.", "Roads & Infrastructure", "High", False, 22.7720, 75.8460),
    ("Square par streetlight picchle 1 mahine se kharab hai.", "Electricity & Streetlights", "Medium", False, 22.7090, 75.8220),
    ("Bypass side drain jam hone se raaste me paani bhara hai.", "Sanitation & Drainage", "High", False, 22.7310, 75.9110),
]

statuses = ["PENDING_ADMIN_REVIEW", "APPROVED_BY_ADMIN", "RESOLVED"]

for i in range(1, 850):
    sample = samples_hnd[i % len(samples_hnd)]
    lat_offset = (random.random() - 0.5) * 0.015
    lng_offset = (random.random() - 0.5) * 0.015
    
    if i <= 300:
        target_ward_id = "ward_14" if i % 2 == 0 else "ward_52"
    else:
        target_ward_id = f"ward_{(i % 85) + 1}"
        
    ward_obj = next((w for w in indore_wards if w["id"] == target_ward_id), indore_wards[0])

    is_demo_user = (i % 25 == 0) or (i <= 3)
    user_email = "citizen.indore@gmail.com" if is_demo_user else f"citizen_{i}@indore.gov.in"
    citizen_name = "Harsh Parmar" if is_demo_user else f"Citizen #{i}"
    status = statuses[i % len(statuses)]
    
    complaint = {
        "id": f"NM-IND-2026-{i:05d}",
        "transcript": sample[0] + f" (Ref ID #{i})",
        "original_language": "Hindi / Malvi Dialect",
        "category": sample[1],
        "urgency": sample[2],
        "health_impact": sample[3],
        "ward_id": target_ward_id,
        "locality": f"{ward_obj['name']}, Indore",
        "lat": round(ward_obj["lat"] + lat_offset, 5),
        "lng": round(ward_obj["lng"] + lng_offset, 5),
        "photo_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=500" if i % 3 == 0 else None,
        "created_at": f"2026-08-{random.randint(1,25):02d}T{random.randint(8,20):02d}:30:00Z",
        "user_email": user_email,
        "citizen_name": citizen_name,
        "citizen_phone": "+91 9826012345" if is_demo_user else f"+91 98260{i:05d}",
        "citizen_id_hash": f"VOTER-IND-{4800+i}",
        "landmark": f"Sector Landmark near {ward_obj['name']}",
        "verification_status": "VERIFIED_CITIZEN",
        "responsible_department": f"Indore Municipal Corporation (IMC) — {sample[1]} Department",
        "responsible_ministry": "Ministry of Housing & Urban Affairs (MoHUA)",
        "nodal_officer": "Er. Rajesh Sharma (Chief Engineer)",
        "current_status": status
    }
    complaints.append(complaint)

with open(r"c:\Users\harsh parmar\Desktop\nagarmitra-dpi\backend\seed_data\seed_complaints.json", "w", encoding="utf-8") as f:
    json.dump(complaints, f, indent=2, ensure_ascii=False)

# 3. Demand Clusters Data
clusters = [
    {
        "id": "DC-IND-001",
        "label": "Drainage Overflow & Sewerage Network Crisis",
        "category": "Sanitation & Drainage",
        "severity": "CRITICAL",
        "locality": "Wards 14 & 15 (Rajendra Nagar - South Indore)",
        "lat": 22.6815,
        "lng": 75.8255,
        "complaint_count": 847,
        "health_risk": True,
        "demand_score": 94,
        "poverty_score": 88,
        "infra_gap_score": 95,
        "budget_gap_score": 100,
        "ppi_score": 94.2,
        "sample_voices": [
            "Bhaiyaji, humare ward 14 me paani ka nala beh raha hai, bacche bimar ho rahe hain!",
            "Gutter ka ganda paani gharon ke samne bhara hai 15 din se.",
            "Peene ke paani ki pipeline aur sewer line mix ho chuki hai."
        ]
    },
    {
        "id": "DC-IND-002",
        "label": "Sanwer Road Industrial Arterial Corridor Reconstruction",
        "category": "Roads & Infrastructure",
        "severity": "HIGH",
        "locality": "Ward 8 (Banganga Industrial Area)",
        "lat": 22.7715,
        "lng": 75.8458,
        "complaint_count": 312,
        "health_risk": False,
        "demand_score": 82,
        "poverty_score": 75,
        "infra_gap_score": 88,
        "budget_gap_score": 90,
        "ppi_score": 83.5,
        "sample_voices": [
            "Banganga industrial area me sadak me bade bade gaddhe hain, truck phans rahe hain."
        ]
    },
    {
        "id": "DC-IND-003",
        "label": "Solar High-Mast & Streetlight Safety Grid Expansion",
        "category": "Electricity & Streetlights",
        "severity": "MEDIUM",
        "locality": "Ward 7 & Ward 10 Peripheral Zones",
        "lat": 22.7095,
        "lng": 75.8225,
        "complaint_count": 185,
        "health_risk": False,
        "demand_score": 74,
        "poverty_score": 68,
        "infra_gap_score": 78,
        "budget_gap_score": 80,
        "ppi_score": 75.0,
        "sample_voices": [
            "Chandan nagar square par streetlight picchle 1 mahine se kharab hai."
        ]
    }
]

with open(r"c:\Users\harsh parmar\Desktop\nagarmitra-dpi\backend\seed_data\seed_clusters.json", "w", encoding="utf-8") as f:
    json.dump(clusters, f, indent=2, ensure_ascii=False)

# 4. Projects DPR Data
projects = [
    {
        "id": "DPR-2026-001",
        "cluster_id": "DC-IND-001",
        "title": "Construct 3.4km Integrated Covered Drainage & Sewerage Pipeline Network",
        "locality": "Wards 14 & 15, South Indore, Madhya Pradesh",
        "category": "Sanitation & Urban Infrastructure",
        "estimated_budget_inr": 38000000,
        "formatted_budget": "₹3.80 Crores",
        "target_beneficiaries": 43500,
        "roi_score": 95,
        "funding_scheme": "AMRUT 2.0 / Swachh Bharat Mission (Urban)",
        "problem_justification": "Aggregated evidence from 847 citizen voice requests across Wards 14 & 15 indicates a critical failure of informal drainage lines. Fused with Census data (52% poverty rate, high child population) and PM Gati Shakti GIS layers (zero stormwater drains within a 3.2km radius), current municipal spending of ₹0 creates a severe public health hazard (dengue, cholera).",
        "scope_of_work": [
            "Installation of 3.4 km high-density RCC underground sewerage and stormwater trunk pipeline",
            "Construction of 18 junction inspection chambers with automated debris traps",
            "1.8 km road resurfacing and asphalt sealing following trench excavation",
            "Integration with South Indore Main Sewerage Treatment Plant (STP)"
        ],
        "impact_metrics": {
            "disease_reduction": "65% estimated drop in waterborne diseases within 12 months",
            "flood_prevention": "Prevents annual monsoon inundation for 8,700 households",
            "economic_savings": "₹1.4 Crores saved annually in individual healthcare and property repair costs"
        },
        "community_upvotes": 2340,
        "total_ratings": 520,
        "rating_sum": 2340.0,
        "status": "APPROVED_FOR_DPR"
    },
    {
        "id": "DPR-2026-002",
        "cluster_id": "DC-IND-002",
        "title": "Sanwer Road Industrial Freight Corridor Asphalt Reconstruction",
        "locality": "Ward 8, Banganga Industrial Belt, Indore",
        "category": "Public Works & Transportation",
        "estimated_budget_inr": 85000000,
        "formatted_budget": "₹8.50 Crores",
        "target_beneficiaries": 68000,
        "roi_score": 88,
        "funding_scheme": "PM Gati Shakti National Master Plan",
        "problem_justification": "Heavy freight movement and severe waterlogging caused massive structural failure on 4.2 km of industrial road. Over 312 citizen and transporter complaints logged.",
        "scope_of_work": [
            "4.2 km 6-lane heavy duty concrete road construction",
            "Stormwater side drain channels with silt traps",
            "Industrial logistics truck parking bay creation"
        ],
        "impact_metrics": {
            "travel_time": "40% reduction in industrial transit delays",
            "accident_prevention": "75% reduction in monsoon vehicle breakdowns"
        },
        "community_upvotes": 1420,
        "total_ratings": 310,
        "rating_sum": 1333.0,
        "status": "APPROVED_FOR_DPR"
    },
    {
        "id": "DPR-2026-003",
        "cluster_id": "DC-IND-003",
        "title": "Solar High-Mast Grid & Smart LED Public Safety Lighting Network",
        "locality": "Wards 7 & 10 Peripheral Outer Ring Corridor, Indore",
        "category": "Energy & Public Safety",
        "estimated_budget_inr": 28000000,
        "formatted_budget": "₹2.80 Crores",
        "target_beneficiaries": 52000,
        "roi_score": 82,
        "funding_scheme": "Smart Cities Mission / National Solar Grid Scheme",
        "problem_justification": "Frequent power outages and unlit stretches across peripheral bypass junctions led to safety concerns and high evening traffic collisions. 185 complaints registered.",
        "scope_of_work": [
            "Installation of 140 solar-powered high-mast LED poles",
            "Centralized IoT grid monitoring controller installation",
            "Automated dusk-to-dawn dimming sensors"
        ],
        "impact_metrics": {
            "energy_savings": "60% lower municipal electricity expenditure",
            "public_safety": "85% decrease in unlit nocturnal safety incidents"
        },
        "community_upvotes": 980,
        "total_ratings": 220,
        "rating_sum": 946.0,
        "status": "APPROVED_FOR_DPR"
    }
]

with open(r"c:\Users\harsh parmar\Desktop\nagarmitra-dpi\backend\seed_data\seed_projects.json", "w", encoding="utf-8") as f:
    json.dump(projects, f, indent=2, ensure_ascii=False)

print("Seed data successfully created!")
