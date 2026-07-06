import os

def read_ftth_specifications(topic: str) -> dict:
    """
    Retrieves local FTTH installation and engineering specifications from the knowledge base.
    Use this tool when evaluating compliance of optical power levels or fiber bend radiuses.
    
    Parameters:
      topic: 'optical' or 'mounting' (or 'installation')
    """
    topic_clean = topic.lower().strip()
    filename = ""
    if "optical" in topic_clean:
        filename = "kb-ftth-optical-standards.txt"
    elif "mounting" in topic_clean or "installation" in topic_clean:
        filename = "kb-ftth-installation-rules.txt"
    else:
        return {
            "status": "error",
            "message": f"Unknown topic '{topic}'. Valid options: 'optical', 'mounting'."
        }

    kb_path = os.path.join("knowledge-base", filename)
    try:
        with open(kb_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {
            "status": "success",
            "topic": topic,
            "specifications": content
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to read knowledge base file: {str(e)}"
        }

def navigate_step(step_id: str) -> dict:
    """
    Commands the PWA frontend to transition the active view to a specific step.
    Use this to guide the technician through the timeline.
    
    Parameters:
      step_id: 'site-overview', 'ont-before', 'ont-after-frontal', 'ont-after-closeup', 'power-meter', or 'panoramic'
    """
    return {
        "status": "success",
        "render_command": {
            "layer": "clinical",
            "action": "navigate_step",
            "step_id": step_id.lower().strip()
        }
    }

def display_validation_result(status: str, message: str) -> dict:
    """
    Displays the final audit evaluation verdict on the technician console.
    Use this to show whether the inspection has been approved or rejected.
    
    Parameters:
      status: 'approved', 'rejected', or 'review_required'
      message: Explanation details for the verdict
    """
    return {
        "status": "success",
        "render_command": {
            "layer": "clinical",
            "action": "display_validation_result",
            "status": status.lower().strip(),
            "message": message
        }
    }

def verify_mac_prefix(mac: str, expected_prefix: str) -> dict:
    """
    Helper tool to verify if a given MAC address matches the expected OUI vendor prefix.
    
    Parameters:
      mac: Full MAC address (e.g. 48:8F:4C:1A:2B:3C)
      expected_prefix: Target prefix (e.g. 48:8F:4C)
    """
    clean_mac = mac.upper().replace("-", ":").strip()
    clean_prefix = expected_prefix.upper().replace("-", ":").strip()
    
    if clean_mac.startswith(clean_prefix):
        return {
            "status": "success",
            "match": True,
            "message": f"MAC address vendor prefix matches expected '{expected_prefix}'."
        }
    else:
        return {
            "status": "success",
            "match": False,
            "message": f"MAC address prefix mismatch! Expected: '{expected_prefix}', got: '{mac}'."
        }
