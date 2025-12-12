"""
============================================
PROJECT ZERO-TOUCH - THE IMPROVER
Self-healing optimization cron job
Runs daily to analyze failures and evolve prompts
============================================
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
import os

# Would import from actual modules
# from .database import db, leadsDb, personasDb
# from openai import AsyncOpenAI


class TheImprover:
    """
    Self-healing optimization system.
    Analyzes lost leads, identifies patterns, and evolves prompts.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.llm = None
        self.analysis_window_hours = 24
        self.ab_test_allocation = 0.2  # 20% of traffic gets new prompts
    
    async def initialize(self):
        """Initialize LLM connection."""
        from openai import AsyncOpenAI
        self.llm = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def run(self) -> Dict[str, Any]:
        """
        Main execution method.
        Called by cron job every 24 hours.
        """
        await self.initialize()
        
        print(f"[TheImprover] Starting analysis at {datetime.now().isoformat()}")
        
        # 1. Get lost leads from past 24 hours
        lost_leads = await self._get_lost_leads()
        
        if not lost_leads:
            print("[TheImprover] No lost leads to analyze")
            return {"status": "no_data", "leads_analyzed": 0}
        
        print(f"[TheImprover] Analyzing {len(lost_leads)} lost leads")
        
        # 2. Analyze failure patterns
        analysis = await self._analyze_failures(lost_leads)
        
        # 3. Generate improved prompts
        improvements = await self._generate_improvements(analysis)
        
        # 4. Save new prompt versions for A/B testing
        await self._save_improvements(improvements)
        
        # 5. Log the improvement job
        job_result = {
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "leads_analyzed": len(lost_leads),
            "patterns_detected": analysis.get("patterns", []),
            "improvements_made": len(improvements),
            "ab_test_allocation": self.ab_test_allocation
        }
        
        await self._log_job(job_result)
        
        print(f"[TheImprover] Completed. Made {len(improvements)} improvements.")
        
        return job_result
    
    async def _get_lost_leads(self) -> List[Dict[str, Any]]:
        """Get lost leads with their negotiation history."""
        # In production, this queries the database
        # SELECT l.*, n.* FROM universal_leads_ledger l
        # JOIN autonomous_negotiation_logs n ON l.id = n.lead_id
        # WHERE l.status = 'lost' AND l.updated_at > NOW() - INTERVAL '24 hours'
        
        # Placeholder data for demonstration
        return [
            {
                "id": "lead-1",
                "status_reason": "price_objection",
                "detected_intent": "buying",
                "business_vertical": "real_estate",
                "interactions": [
                    {"sentiment": 0.6, "objections": ["price"]},
                    {"sentiment": 0.3, "objections": ["price", "timing"]},
                    {"sentiment": -0.2, "objections": ["price"]}
                ]
            },
            {
                "id": "lead-2",
                "status_reason": "no_response",
                "detected_intent": "asking",
                "business_vertical": "law",
                "interactions": [
                    {"sentiment": 0.4, "objections": []},
                    {"sentiment": 0.1, "objections": ["trust"]}
                ]
            }
        ]
    
    async def _analyze_failures(self, leads: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze failure patterns using AI."""
        
        # Aggregate data
        objection_counts = {}
        sentiment_drops = []
        verticals = {}
        
        for lead in leads:
            vertical = lead.get("business_vertical", "unknown")
            verticals[vertical] = verticals.get(vertical, 0) + 1
            
            prev_sentiment = None
            for interaction in lead.get("interactions", []):
                # Count objections
                for obj in interaction.get("objections", []):
                    objection_counts[obj] = objection_counts.get(obj, 0) + 1
                
                # Track sentiment drops
                current_sentiment = interaction.get("sentiment", 0)
                if prev_sentiment is not None:
                    drop = prev_sentiment - current_sentiment
                    if drop > 0.2:  # Significant drop
                        sentiment_drops.append({
                            "lead_id": lead["id"],
                            "drop": drop,
                            "objections": interaction.get("objections", [])
                        })
                prev_sentiment = current_sentiment
        
        # Use AI to analyze patterns
        analysis_prompt = f"""
Analyze these failure patterns from lost leads:

Objection frequency: {json.dumps(objection_counts)}
Significant sentiment drops: {len(sentiment_drops)}
Verticals affected: {json.dumps(verticals)}

Identify:
1. Most common failure points
2. Which objections are poorly handled
3. Specific improvements to negotiation tactics

Return JSON:
{{
    "patterns": ["pattern1", "pattern2"],
    "poorly_handled_objections": ["objection1", "objection2"],
    "improvement_suggestions": ["suggestion1", "suggestion2"],
    "affected_personas": ["shark", "empath"]
}}
"""
        
        response = await self.llm.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an expert sales and negotiation analyst."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(response.choices[0].message.content)
        analysis["objection_counts"] = objection_counts
        analysis["sentiment_drops"] = sentiment_drops
        analysis["verticals"] = verticals
        
        return analysis
    
    async def _generate_improvements(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate improved prompts based on analysis."""
        improvements = []
        
        affected_personas = analysis.get("affected_personas", ["professional"])
        suggestions = analysis.get("improvement_suggestions", [])
        objections = analysis.get("poorly_handled_objections", [])
        
        for persona in affected_personas:
            # Get current prompt (placeholder)
            current_prompt = await self._get_current_prompt(persona)
            
            improvement_prompt = f"""
The current prompt for the "{persona}" agent:
---
{current_prompt}
---

This prompt is failing to handle these objections effectively: {objections}

Rewrite the prompt to:
1. Better address these objections
2. Implement these improvements: {suggestions}
3. Maintain the original persona characteristics
4. Be more effective at preventing sentiment drops

Return the improved prompt only, no explanations.
Include both English and Hebrew versions.

Format:
ENGLISH:
[english prompt]

HEBREW:
[hebrew prompt]
"""
            
            response = await self.llm.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert prompt engineer for sales AI agents."},
                    {"role": "user", "content": improvement_prompt}
                ],
                temperature=0.5,
                max_tokens=1000
            )
            
            improved_content = response.choices[0].message.content
            
            # Parse English and Hebrew prompts
            parts = improved_content.split("HEBREW:")
            english_prompt = parts[0].replace("ENGLISH:", "").strip()
            hebrew_prompt = parts[1].strip() if len(parts) > 1 else ""
            
            improvements.append({
                "persona": persona,
                "previous_prompt": current_prompt,
                "improved_prompt_en": english_prompt,
                "improved_prompt_he": hebrew_prompt,
                "targeting_objections": objections,
                "created_at": datetime.now().isoformat()
            })
        
        return improvements
    
    async def _get_current_prompt(self, persona: str) -> str:
        """Get current prompt for persona (placeholder)."""
        prompts = {
            "shark": "You are an aggressive negotiator...",
            "empath": "You are a warm, understanding agent...",
            "concierge": "You are a luxury service specialist...",
            "professional": "You are a professional consultant...",
            "closer": "You are a deal-closing specialist..."
        }
        return prompts.get(persona, prompts["professional"])
    
    async def _save_improvements(self, improvements: List[Dict[str, Any]]):
        """Save improved prompts as new versions for A/B testing."""
        for improvement in improvements:
            # In production, this saves to agent_personas table
            # with is_active=True, version=current+1, and tracks A/B allocation
            print(f"[TheImprover] Saving improved prompt for {improvement['persona']}")
            print(f"  Targeting objections: {improvement['targeting_objections']}")
    
    async def _log_job(self, result: Dict[str, Any]):
        """Log the improvement job to database."""
        # In production, this inserts into improvement_jobs table
        print(f"[TheImprover] Job logged: {json.dumps(result, indent=2)}")


class PromptABTest:
    """
    A/B testing system for prompt versions.
    """
    
    def __init__(self, persona: str, allocation: float = 0.2):
        self.persona = persona
        self.allocation = allocation  # Percentage of traffic for new version
    
    def select_version(self, lead_id: str) -> str:
        """
        Deterministically select prompt version based on lead ID.
        Ensures same lead always gets same version.
        """
        import hashlib
        
        # Create deterministic hash
        hash_input = f"{lead_id}:{self.persona}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        
        # Normalize to 0-1 range
        normalized = (hash_value % 1000) / 1000
        
        if normalized < self.allocation:
            return "new"
        return "current"
    
    async def track_outcome(self, lead_id: str, version: str, converted: bool):
        """Track conversion outcome for analysis."""
        # In production, this updates metrics in database
        print(f"[A/B] Lead {lead_id} on {version} version: {'converted' if converted else 'lost'}")


# ============================================
# CRON JOB ENTRY POINT
# ============================================

async def run_daily_improvement():
    """Entry point for daily cron job."""
    improver = TheImprover()
    result = await improver.run()
    return result


if __name__ == "__main__":
    # For manual testing
    result = asyncio.run(run_daily_improvement())
    print(f"\nFinal Result: {json.dumps(result, indent=2)}")
