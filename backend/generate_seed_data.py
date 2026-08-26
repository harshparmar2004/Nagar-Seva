import json
import random

# 1. Wards Data (Real Indore IMC Wards & Landmarks)
indore_wards = [
    {"id": "ward_1", "name": "Rajwada & Central Market", "zone": "Zone 1 - Central", "lat": 22.7196, "lng": 75.8577, "population": 32100, "poverty_rate": 0.35, "literacy_rate": 0.82, "infra_score": 70, "budget_allocated": 15000000},
    {"id": "ward_2", "name": "Vijay Nagar Sector A-C", "zone": "Zone 2 - East", "lat": 22.7533, "lng": 75.8937, "population": 41200, "poverty_rate": 0.18, "literacy_rate": 0.94, "infra_score": 85, "budget_allocated": 22000000},
    {"id": "ward_3", "name": "Palasia & Greater Kailash", "zone": "Zone 2 - East", "lat": 22.7244, "lng": 75.8839, "population": 28900, "poverty_rate": 0.22, "literacy_rate": 0.91, "infra_score": 80, "budget_allocated": 18000000},
    {"id": "ward_4", "name": "Bhawarkua & University Campus", "zone": "Zone 3 - South", "lat": 22.6916, "lng": 75.8674, "population": 38500, "poverty_rate": 0.32, "literacy_rate": 0.88, "infra_score": 65, "budget_allocated": 14000000},
    {"id": "ward_5", "name": "Rau & Transport Nagar", "zone": "Zone 3 - South", "lat": 22.6322, "lng": 75.8055, "population": 45000, "poverty_rate": 0.48, "literacy_rate": 0.72, "infra_score": 45, "budget_allocated": 8000000},
    {"id": "ward_6", "name": "Sudama Nagar & Annapurna", "zone": "Zone 4 - West", "lat": 22.6974, "lng": 75.8340, "population": 36700, "poverty_rate": 0.41, "literacy_rate": 0.76, "infra_score": 52, "budget_allocated": 9500000},
    {"id": "ward_7", "name": "Chandan Nagar & Dhar Road", "zone": "Zone 4 - West", "lat": 22.7088, "lng": 75.8211, "population": 48200, "poverty_rate": 0.54, "literacy_rate": 0.69, "infra_score": 38, "budget_allocated": 6000000},
    {"id": "ward_8", "name": "Banganga & Sanwer Road", "zone": "Zone 5 - North", "lat": 22.7712, "lng": 75.8455, "population": 52100, "poverty_rate": 0.58, "literacy_rate": 0.65, "infra_score": 32, "budget_allocated": 5000000},
    {"id": "ward_9", "name": "Pardesipura & Kulkarni Nagar", "zone": "Zone 5 - North", "lat": 22.7410, "lng": 75.8640, "population": 39400, "poverty_rate": 0.46, "literacy_rate": 0.74, "infra_score": 48, "budget_allocated": 8500000},
    {"id": "ward_10", "name": "Khajrana & Bypass Corridor", "zone": "Zone 2 - East", "lat": 22.7300, "lng": 75.9100, "population": 44800, "poverty_rate": 0.50, "literacy_rate": 0.71, "infra_score": 40, "budget_allocated": 7000000},
    {"id": "ward_14", "name": "Rajendra Nagar & Cat Road", "zone": "Zone 3 - South", "lat": 22.6800, "lng": 75.8250, "population": 43500, "poverty_rate": 0.52, "literacy_rate": 0.68, "infra_score": 30, "budget_allocated": 0},
    {"id": "ward_15", "name": "Silicon City Peripheral Area", "zone": "Zone 3 - South", "lat": 22.6650, "lng": 75.8150, "population": 39800, "poverty_rate": 0.49, "literacy_rate": 0.70, "infra_score": 35, "budget_allocated": 0}
]

# Write wards.json
with open(r"c:\Users\harsh parmar\Desktop\nagarmitra-dpi\backend\seed_data\indore_wards.json", "w", encoding="utf-8") as f:
    json.dump(indore_wards, f, indent=2, ensure_ascii=False)

# 2. Complaints Data (High density in Ward 14 & 15 for drainage hotspot)
complaints = []
categories = ["Sanitation & Drainage", "Water Supply", "Roads & Infrastructure", "Electricity & Streetlights", "Healthcare", "Education"]

samples_hnd = [
    ("Bhaiyaji, humare ward 14 me paani ka nala beh raha hai, bacche bimar ho rahe hain, sadak poori toot gayi hai!", "Sanitation & Drainage", "Critical", True, "ward_14", 22.6812, 75.8261),
    ("Gutter ka ganda paani gharon ke samne bhara hai 15 din se, koi sunwayi nahi ho rahi.", "Sanitation & Drainage", "Critical", True, "ward_14", 22.6825, 75.8245),
    ("Monsoon me nala overflow ho gaya hai, dengue ka khatra badh raha hai.", "Sanitation & Drainage", "High", True, "ward_14", 22.6805, 75.8270),
    ("Ward 14 main road par nale ki patti tut gayi hai, do bike wale gir gaye hain.", "Sanitation & Drainage", "Critical", False, "ward_14", 22.6798, 75.8239),
    ("Peene ke paani ki pipeline aur sewer line mix ho chuki hai, ganda paani aa raha hai.", "Water Supply", "Critical", True, "ward_14", 22.6830, 75.8280),
    ("Ward 15 Silicon city bypass ke pass lighting nahi hai, raat ko accident hote hain.", "Electricity & Streetlights", "High", False, "ward_15", 22.6660, 75.8165),
    ("Primary Health Sub-centre me doctor nahi aate aur dawayi khatam hai.", "Healthcare", "High", True, "ward_15", 22.6645, 75.8140),
    ("Banganga industrial area me sadak me bade bade gaddhe hain, truck phans rahe hain.", "Roads & Infrastructure", "High", False, "ward_8", 22.7720, 75.8460),
    ("Chandan nagar square par streetlight picchle 1 mahine se kharab hai.", "Electricity & Streetlights", "Medium", False, "ward_7", 22.7090, 75.8220),
    ("Khajrana bypass side drain jam hone se raaste me paani bhara hai.", "Sanitation & Drainage", "High", False, "ward_10", 22.7310, 75.9110),
]

for i in range(1, 850):
    sample = samples_hnd[i % len(samples_hnd)]
    lat_offset = (random.random() - 0.5) * 0.015
    lng_offset = (random.random() - 0.5) * 0.015
    
    complaint = {
        "id": f"NM-IND-2026-{i:05d}",
        "transcript": sample[0] + f" (Ref ID #{i})",
        "original_language": "Hindi / Malvi Dialect",
        "category": sample[1],
        "urgency": sample[2],
        "health_impact": sample[3],
        "ward_id": sample[4],
        "locality": "Rajendra Nagar Sector 3" if sample[4] == "ward_14" else "Indore Locality Zone",
        "lat": round(sample[5] + lat_offset, 5),
        "lng": round(sample[6] + lng_offset, 5),
        "photo_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=500" if i % 3 == 0 else None,
        "created_at": f"2026-08-{random.randint(1,25):02d}T{random.randint(8,20):02d}:30:00Z"
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
        "status": "APPROVED_FOR_DPR"
    }
]

with open(r"c:\Users\harsh parmar\Desktop\nagarmitra-dpi\backend\seed_data\seed_projects.json", "w", encoding="utf-8") as f:
    json.dump(projects, f, indent=2, ensure_ascii=False)

print("Seed data successfully created!")
