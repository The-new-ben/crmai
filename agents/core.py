"""
============================================
PROJECT ZERO-TOUCH - AI AGENTS SYSTEM
Recursive agent architecture with dynamic spawning
============================================
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from enum import Enum
import asyncio
import json
import os
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================

class AgentPersona(Enum):
    SHARK = "shark"
    EMPATH = "empath"
    CONCIERGE = "concierge"
    PROFESSIONAL = "professional"
    CLOSER = "closer"

class LeadStatus(Enum):
    INCOMING = "incoming"
    PROCESSING = "processing"
    NEGOTIATING = "negotiating"
    CONTRACT_SENT = "contract_sent"
    PAID = "paid"
    LOST = "lost"

@dataclass
class Lead:
    id: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    raw_data: Dict[str, Any] = field(default_factory=dict)
    detected_intent: str = "other"
    detected_urgency: int = 5
    estimated_value: float = 0
    required_persona: str = "professional"
    business_vertical: str = "other"
    status: str = "incoming"
    primary_language: str = "en"

@dataclass
class AgentResult:
    success: bool
    sentiment: float = 0.0
    message: str = ""
    next_action: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)

# ============================================
# BASE AGENT CLASS
# ============================================

class BaseAgent(ABC):
    """Abstract base class for all agents."""
    
    def __init__(
        self, 
        lead: Lead, 
        persona: AgentPersona,
        config: Dict[str, Any] = None
    ):
        self.lead = lead
        self.persona = persona
        self.config = config or {}
        self.llm = None  # Will be initialized
        self.providers = {}  # Voice, messaging, etc.
        self.interaction_count = 0
        self.max_interactions = 20
        
    @abstractmethod
    async def execute(self) -> AgentResult:
        """Main execution method - must be implemented by subclasses."""
        pass
    
    async def initialize(self):
        """Initialize LLM and providers."""
        from openai import AsyncOpenAI
        self.llm = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    async def get_persona_prompt(self) -> str:
        """Get system prompt for this persona."""
        prompts = {
            AgentPersona.SHARK: """You are an aggressive, highly skilled negotiator. 
You push for the best deal possible. You are direct, confident, and never back down easily. 
You identify weaknesses in objections and turn them into opportunities. 
Always maintain professionalism but be assertive.""",
            
            AgentPersona.EMPATH: """You are a warm, understanding, and emotionally intelligent agent.
You listen carefully, validate feelings, and build genuine rapport.
You guide clients gently toward solutions while making them feel heard and supported.""",
            
            AgentPersona.CONCIERGE: """You are a luxury service specialist. 
You treat every client as VIP. You are sophisticated, attentive to details, 
and provide white-glove service. You anticipate needs and exceed expectations.""",
            
            AgentPersona.PROFESSIONAL: """You are a professional business consultant.
You are knowledgeable, helpful, and efficient. You provide clear information
and guide clients through processes smoothly.""",
            
            AgentPersona.CLOSER: """You are a deal-closing specialist.
Your only goal is to finalize transactions. You handle last-minute objections,
create urgency, and guide clients through the final steps.
You are encouraging but firm about moving forward."""
        }
        return prompts.get(self.persona, prompts[AgentPersona.PROFESSIONAL])
    
    async def generate_response(
        self, 
        message: str, 
        context: List[Dict[str, str]] = None
    ) -> str:
        """Generate AI response using LLM."""
        system_prompt = await self.get_persona_prompt()
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add context from previous interactions
        if context:
            messages.extend(context)
        
        # Add lead context
        lead_context = f"""
Current Lead Information:
- Name: {self.lead.contact_name or 'Unknown'}
- Intent: {self.lead.detected_intent}
- Urgency: {self.lead.detected_urgency}/10
- Estimated Value: ${self.lead.estimated_value}
- Business: {self.lead.business_vertical}
- Language: {self.lead.primary_language}

Incoming Message: {message}

Generate an appropriate response in {self.lead.primary_language.upper()}.
Be concise but effective."""
        
        messages.append({"role": "user", "content": lead_context})
        
        response = await self.llm.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    
    async def analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of text (-1 to 1)."""
        response = await self.llm.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "Analyze sentiment. Return only a number from -1 (very negative) to 1 (very positive)."
                },
                {"role": "user", "content": text}
            ],
            temperature=0,
            max_tokens=10
        )
        
        try:
            return float(response.choices[0].message.content.strip())
        except:
            return 0.0
    
    async def log_interaction(
        self, 
        channel: str, 
        direction: str, 
        content: str, 
        response: str = None,
        sentiment: float = None
    ):
        """Log interaction to database (placeholder)."""
        # This would save to autonomous_negotiation_logs
        self.interaction_count += 1
        print(f"[{self.persona.value}] {direction} on {channel}: {content[:50]}...")
        if response:
            print(f"[{self.persona.value}] Response: {response[:50]}...")
    
    async def should_escalate(self, sentiment: float) -> bool:
        """Check if we should escalate to human."""
        threshold = self.config.get("escalation_threshold", 0.3)
        return sentiment < -threshold or self.interaction_count >= self.max_interactions
    
    async def should_close(self, sentiment: float) -> bool:
        """Check if we should attempt to close."""
        threshold = self.config.get("closing_threshold", 0.8)
        return sentiment >= threshold


# ============================================
# CHIEF OF STAFF AGENT
# ============================================

class ChiefOfStaffAgent(BaseAgent):
    """
    Central orchestrator that analyzes leads and spawns appropriate sub-agents.
    """
    
    def __init__(self, lead: Lead, config: Dict[str, Any] = None):
        super().__init__(lead, AgentPersona.PROFESSIONAL, config)
        self.agent_registry = {
            "shark": lambda l: SharkAgent(l),
            "empath": lambda l: EmpathAgent(l),
            "concierge": lambda l: ConciergeAgent(l),
            "professional": lambda l: ProfessionalAgent(l),
            "closer": lambda l: CloserAgent(l)
        }
    
    async def execute(self) -> AgentResult:
        """Analyze lead and spawn appropriate agent."""
        await self.initialize()
        
        # 1. Analyze the lead
        decision = await self.analyze_lead()
        
        # 2. Spawn the appropriate sub-agent
        agent_type = decision.get("agent_type", "professional")
        agent_factory = self.agent_registry.get(agent_type)
        
        if not agent_factory:
            agent_factory = self.agent_registry["professional"]
        
        sub_agent = agent_factory(self.lead)
        await sub_agent.initialize()
        
        # 3. Execute the sub-agent
        result = await sub_agent.execute()
        
        # 4. If successful enough, spawn closer
        if result.sentiment >= 0.8:
            closer = CloserAgent(self.lead)
            await closer.initialize()
            close_result = await closer.execute()
            return close_result
        
        return result
    
    async def analyze_lead(self) -> Dict[str, Any]:
        """Analyze lead and determine best agent."""
        prompt = f"""
Analyze this lead and determine the best agent to handle it.

Lead Data: {json.dumps(self.lead.raw_data)}
Detected Intent: {self.lead.detected_intent}
Business Vertical: {self.lead.business_vertical}
Urgency: {self.lead.detected_urgency}
Language: {self.lead.primary_language}

RULES:
- Criminal/aggressive legal case → shark
- Emotional/personal matter → empath
- Luxury/VIP/high-value → concierge
- Standard business → professional

Return JSON only:
{{"agent_type": "...", "priority": 1-10, "reasoning": "..."}}
"""
        
        response = await self.llm.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a lead routing expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)


# ============================================
# HUNTER AGENT
# ============================================

class HunterAgent(BaseAgent):
    """
    Omnichannel outreach agent.
    WhatsApp → Email → Voice Call escalation.
    """
    
    def __init__(self, lead: Lead, persona: AgentPersona = AgentPersona.PROFESSIONAL):
        super().__init__(lead, persona)
        self.response_delay_min = 60  # 1 minute
        self.response_delay_max = 180  # 3 minutes
        self.wait_for_reply_timeout = 1800  # 30 minutes
    
    async def execute(self) -> AgentResult:
        """Execute omnichannel outreach workflow."""
        await self.initialize()
        
        # 1. Wait to simulate human behavior
        delay = self._random_delay()
        await asyncio.sleep(delay)
        
        # 2. Send WhatsApp intro
        intro_message = await self._generate_intro_message()
        whatsapp_result = await self._send_whatsapp(intro_message)
        
        await self.log_interaction(
            channel="whatsapp",
            direction="outbound",
            content=intro_message
        )
        
        # 3. Wait for response
        response = await self._wait_for_response()
        
        if response:
            # Got a reply - continue conversation
            sentiment = await self.analyze_sentiment(response)
            reply = await self.generate_response(response)
            await self._send_whatsapp(reply)
            
            await self.log_interaction(
                channel="whatsapp",
                direction="inbound",
                content=response,
                response=reply,
                sentiment=sentiment
            )
            
            return AgentResult(
                success=True,
                sentiment=sentiment,
                message="WhatsApp conversation initiated",
                next_action="continue_whatsapp"
            )
        
        # 4. No reply - check if message was read
        if await self._was_message_read():
            # Read but no reply → trigger voice call
            call_result = await self._trigger_voice_call()
            
            return AgentResult(
                success=call_result.get("success", False),
                sentiment=call_result.get("sentiment", 0),
                message="Voice call triggered after no WhatsApp reply",
                next_action="follow_up"
            )
        
        # 5. Not even read - try email
        await self._send_email_follow_up()
        
        return AgentResult(
            success=True,
            sentiment=0.3,
            message="Email follow-up sent",
            next_action="wait_for_email"
        )
    
    async def _generate_intro_message(self) -> str:
        """Generate personalized intro message."""
        language = self.lead.primary_language
        
        prompts = {
            "en": f"Generate a warm, professional WhatsApp intro for someone interested in {self.lead.business_vertical}. Keep it under 50 words.",
            "he": f"Generate a warm, professional WhatsApp intro in Hebrew for someone interested in {self.lead.business_vertical}. Keep it under 50 words."
        }
        
        response = await self.llm.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": await self.get_persona_prompt()},
                {"role": "user", "content": prompts.get(language, prompts["en"])}
            ],
            temperature=0.7,
            max_tokens=100
        )
        
        return response.choices[0].message.content
    
    async def _send_whatsapp(self, message: str) -> Dict[str, Any]:
        """Send WhatsApp message (placeholder)."""
        # This would use the WhatsApp provider
        print(f"[WhatsApp] Sending to {self.lead.contact_phone}: {message}")
        return {"success": True, "message_id": "mock_id"}
    
    async def _wait_for_response(self) -> Optional[str]:
        """Wait for response (placeholder)."""
        # In production, this would poll or use webhooks
        await asyncio.sleep(5)  # Simulated wait
        return None  # Simulated no response
    
    async def _was_message_read(self) -> bool:
        """Check if message was read (placeholder)."""
        return True  # Simulated
    
    async def _trigger_voice_call(self) -> Dict[str, Any]:
        """Trigger AI voice call."""
        script = await self._generate_voice_script()
        
        # This would use Vapi or Twilio
        print(f"[Voice] Calling {self.lead.contact_phone} with script: {script[:50]}...")
        
        return {
            "success": True,
            "sentiment": 0.5,
            "transcript": "Simulated call transcript"
        }
    
    async def _generate_voice_script(self) -> str:
        """Generate voice call opening script."""
        language = self.lead.primary_language
        topic = self.lead.business_vertical
        
        scripts = {
            "en": f"Hello, I saw you inquired about {topic}. I'm the senior manager here. Do you have a moment to discuss?",
            "he": f"שלום, ראיתי שהתעניינת ב{topic}. אני המנהל הבכיר כאן. יש לך רגע לדבר?"
        }
        
        return scripts.get(language, scripts["en"])
    
    async def _send_email_follow_up(self):
        """Send email follow-up."""
        print(f"[Email] Sending follow-up to {self.lead.contact_email}")
    
    def _random_delay(self) -> int:
        """Get random delay within configured range."""
        import random
        return random.randint(self.response_delay_min, self.response_delay_max)


# ============================================
# SPECIALIZED AGENTS
# ============================================

class SharkAgent(HunterAgent):
    """Aggressive negotiator agent."""
    
    def __init__(self, lead: Lead):
        super().__init__(lead, AgentPersona.SHARK)


class EmpathAgent(HunterAgent):
    """Emotionally intelligent agent."""
    
    def __init__(self, lead: Lead):
        super().__init__(lead, AgentPersona.EMPATH)


class ConciergeAgent(HunterAgent):
    """VIP/luxury service agent."""
    
    def __init__(self, lead: Lead):
        super().__init__(lead, AgentPersona.CONCIERGE)


class ProfessionalAgent(HunterAgent):
    """Standard professional agent."""
    
    def __init__(self, lead: Lead):
        super().__init__(lead, AgentPersona.PROFESSIONAL)


# ============================================
# CLOSER AGENT
# ============================================

class CloserAgent(BaseAgent):
    """
    Contract & Finance agent.
    Activates when sentiment > 0.8.
    """
    
    def __init__(self, lead: Lead):
        super().__init__(lead, AgentPersona.CLOSER)
    
    async def execute(self) -> AgentResult:
        """Execute closing workflow."""
        await self.initialize()
        
        # 1. Generate contract
        contract = await self._generate_contract()
        
        # 2. Send for signature
        signature_request = await self._send_for_signature(contract)
        
        if not signature_request.get("success"):
            return AgentResult(
                success=False,
                sentiment=0.5,
                message="Failed to send contract",
                data=signature_request
            )
        
        # 3. Wait for signature (in production, this would be event-driven)
        # 4. Generate invoice
        # 5. Send invoice
        
        return AgentResult(
            success=True,
            sentiment=0.9,
            message="Contract sent for signature",
            next_action="wait_for_signature",
            data={"contract_id": contract.get("id"), "signature_request": signature_request}
        )
    
    async def _generate_contract(self) -> Dict[str, Any]:
        """Generate contract from template."""
        # This would use dynamic templates
        contract_data = {
            "id": f"contract_{self.lead.id}",
            "client_name": self.lead.contact_name,
            "value": self.lead.estimated_value,
            "created_at": datetime.now().isoformat()
        }
        
        print(f"[Contract] Generated contract {contract_data['id']}")
        return contract_data
    
    async def _send_for_signature(self, contract: Dict[str, Any]) -> Dict[str, Any]:
        """Send contract for e-signature."""
        # This would use DocuSign or PandaDoc provider
        print(f"[DocuSign] Sending contract {contract['id']} to {self.lead.contact_email}")
        
        return {
            "success": True,
            "envelope_id": f"envelope_{contract['id']}",
            "status": "sent"
        }


# ============================================
# ENTRY POINT
# ============================================

async def process_lead(lead_data: Dict[str, Any]) -> AgentResult:
    """Main entry point for processing a new lead."""
    
    # Create lead object
    lead = Lead(
        id=lead_data.get("id"),
        contact_name=lead_data.get("contact_name"),
        contact_phone=lead_data.get("contact_phone"),
        contact_email=lead_data.get("contact_email"),
        raw_data=lead_data.get("raw_data", {}),
        detected_intent=lead_data.get("detected_intent", "other"),
        detected_urgency=lead_data.get("detected_urgency", 5),
        estimated_value=lead_data.get("estimated_value", 0),
        required_persona=lead_data.get("required_persona", "professional"),
        business_vertical=lead_data.get("business_vertical", "other"),
        status=lead_data.get("status", "incoming"),
        primary_language=lead_data.get("primary_language", "en")
    )
    
    # Create Chief of Staff to orchestrate
    chief = ChiefOfStaffAgent(lead)
    
    # Execute the workflow
    result = await chief.execute()
    
    return result


# Example usage
if __name__ == "__main__":
    import asyncio
    
    test_lead = {
        "id": "test-123",
        "contact_name": "John Doe",
        "contact_phone": "+1234567890",
        "contact_email": "john@example.com",
        "raw_data": {"message": "I need a lawyer for my divorce case"},
        "detected_intent": "legal",
        "detected_urgency": 7,
        "estimated_value": 5000,
        "required_persona": "shark",
        "business_vertical": "law",
        "primary_language": "en"
    }
    
    # result = asyncio.run(process_lead(test_lead))
    # print(f"Result: {result}")
    print("Agent system ready. Import process_lead() to use.")
