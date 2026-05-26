class DecisionEngine:
    def __init__(self, risk_threshold_red: float = 0.70, risk_threshold_yellow: float = 0.40):
        self.risk_threshold_red = risk_threshold_red
        self.risk_threshold_yellow = risk_threshold_yellow

    def calculate_risk_score(self, 
                              enemy_probability: float, 
                              terrain_danger: float, 
                              visibility: float, 
                              fatigue: float, 
                              ammo: float) -> dict:
        """
        Calculates the tactical risk index using a weighted model.
        Inputs range from 0.0 to 1.0 (except ammo which is 0 to 100).
        
        Formula:
            BaseRisk = (EnemyProb * 0.40) + (TerrainDanger * 0.30) + ((1 - Visibility) * 0.15) + (Fatigue * 0.15)
            AmmoPenalty = 0.15 if ammo < 30 else 0.0
            FinalRisk = min(1.0, BaseRisk + AmmoPenalty)
        """
        # Ensure values are bound correctly
        enemy_prob = max(0.0, min(1.0, enemy_probability))
        terrain_cost = max(0.0, min(1.0, terrain_danger))
        vis_score = max(0.0, min(1.0, visibility))
        fatigue_score = max(0.0, min(1.0, fatigue))
        ammo_pct = max(0.0, min(100.0, ammo))

        # Weight components
        enemy_weight = 0.40
        terrain_weight = 0.30
        visibility_weight = 0.15
        fatigue_weight = 0.15

        # Calculations
        base_risk = (
            (enemy_prob * enemy_weight) +
            (terrain_cost * terrain_weight) +
            ((1.0 - vis_score) * visibility_weight) +
            (fatigue_score * fatigue_weight)
        )

        # Ammo warning impact (soldier is more vulnerable when out of bullets)
        ammo_penalty = 0.0
        if ammo_pct < 30.0:
            # Scale penalty depending on how close to 0 ammo is
            ammo_penalty = 0.15 * (1.0 - (ammo_pct / 30.0))

        risk_score = min(1.0, base_risk + ammo_penalty)

        # Determine tactical actions and alerts
        if risk_score >= self.risk_threshold_red:
            status = "RED"
            action = "REROUTE_MANDATORY"
            recommendation = "ALERT: Critical risk index. Abandon current vector immediately. Initiating dynamic tactical rerouting."
        elif risk_score >= self.risk_threshold_yellow:
            status = "YELLOW"
            action = "PROCEED_WITH_CAUTION"
            recommendation = "CAUTION: Elevated risk index. Proceed along primary route with high vigilance and stealth."
        else:
            status = "GREEN"
            action = "PROCEED"
            recommendation = "SECURE: Risk profile is normal. Proceed along the planned route."

        return {
            "risk_score": round(risk_score, 3),
            "base_risk": round(base_risk, 3),
            "ammo_penalty": round(ammo_penalty, 3),
            "status": status,
            "action": action,
            "recommendation": recommendation,
            "components": {
                "enemy_probability": enemy_prob,
                "terrain_danger": terrain_cost,
                "visibility": vis_score,
                "fatigue": fatigue_score,
                "ammo": ammo_pct
            }
        }

if __name__ == "__main__":
    engine = DecisionEngine()
    # Test high risk scenario
    res1 = engine.calculate_risk_score(enemy_probability=0.8, terrain_danger=0.6, visibility=0.4, fatigue=0.7, ammo=15)
    print("Test 1 (High Threat):")
    print(res1)
    
    # Test low risk scenario
    res2 = engine.calculate_risk_score(enemy_probability=0.1, terrain_danger=0.2, visibility=0.9, fatigue=0.2, ammo=95)
    print("\nTest 2 (Low Threat):")
    print(res2)
