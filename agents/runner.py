"""
============================================
PROJECT ZERO-TOUCH - AGENT RUNNER
Entry point for running agents from Node.js API
============================================
"""

import sys
import json
import asyncio
from core import process_lead, Lead, AgentResult


async def main():
    """
    Main entry point - reads lead data from stdin and processes it.
    """
    # Read input from stdin
    input_data = sys.stdin.read()
    
    try:
        lead_data = json.loads(input_data)
    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }))
        sys.exit(1)
    
    # Process the lead
    try:
        result = await process_lead(lead_data)
        
        output = {
            "success": result.success,
            "sentiment": result.sentiment,
            "message": result.message,
            "next_action": result.next_action,
            "data": result.data
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)


def process_single_lead(lead_json: str) -> str:
    """
    Synchronous wrapper for processing a single lead.
    Used when called from Node.js.
    """
    lead_data = json.loads(lead_json)
    result = asyncio.run(process_lead(lead_data))
    
    return json.dumps({
        "success": result.success,
        "sentiment": result.sentiment,
        "message": result.message,
        "next_action": result.next_action,
        "data": result.data
    })


if __name__ == "__main__":
    asyncio.run(main())
