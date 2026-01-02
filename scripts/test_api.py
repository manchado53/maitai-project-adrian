"""Test script to validate all API endpoints."""

import requests

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoints."""
    print("\n=== Health Checks ===")

    r = requests.get(f"{BASE_URL}/")
    print(f"GET /: {r.status_code} - {r.json()}")
    assert r.status_code == 200

    r = requests.get(f"{BASE_URL}/health")
    print(f"GET /health: {r.status_code} - {r.json()}")
    assert r.status_code == 200


def test_prompts():
    """Test prompt CRUD endpoints."""
    print("\n=== Prompts ===")

    # List prompts
    r = requests.get(f"{BASE_URL}/prompts")
    print(f"GET /prompts: {r.status_code} - {len(r.json()['prompts'])} prompts")
    assert r.status_code == 200

    # Get single prompt
    r = requests.get(f"{BASE_URL}/prompts/v1")
    print(f"GET /prompts/v1: {r.status_code} - {r.json()['name']}")
    assert r.status_code == 200

    # Create prompt
    new_prompt = {
        "id": "test-prompt",
        "name": "Test Prompt",
        "template": "Classify: {ticket}\nCategory:"
    }
    r = requests.post(f"{BASE_URL}/prompts", json=new_prompt)
    print(f"POST /prompts: {r.status_code} - created '{r.json()['id']}'")
    assert r.status_code == 201

    # Update prompt
    r = requests.put(f"{BASE_URL}/prompts/test-prompt", json={"name": "Updated Test"})
    print(f"PUT /prompts/test-prompt: {r.status_code} - name is now '{r.json()['name']}'")
    assert r.status_code == 200

    # Delete prompt
    r = requests.delete(f"{BASE_URL}/prompts/test-prompt")
    print(f"DELETE /prompts/test-prompt: {r.status_code}")
    assert r.status_code == 204


def test_runs():
    """Test run endpoints."""
    print("\n=== Runs ===")

    # List runs
    r = requests.get(f"{BASE_URL}/runs")
    print(f"GET /runs: {r.status_code} - {len(r.json()['runs'])} runs")
    assert r.status_code == 200

    # List runs filtered by prompt
    r = requests.get(f"{BASE_URL}/runs?prompt_id=v1")
    print(f"GET /runs?prompt_id=v1: {r.status_code} - {len(r.json()['runs'])} runs for v1")
    assert r.status_code == 200

    # Note: Not testing POST /runs as it triggers actual LLM calls


def test_metrics():
    """Test metrics endpoint."""
    print("\n=== Metrics ===")

    r = requests.get(f"{BASE_URL}/metrics/summary")
    data = r.json()
    print(f"GET /metrics/summary: {r.status_code}")
    print(f"  - Total runs: {data['total_runs']}")
    print(f"  - Test set size: {data['test_set_size']}")
    print(f"  - Best prompt: {data['best_prompt']}")
    assert r.status_code == 200


def test_test_set():
    """Test test set endpoints."""
    print("\n=== Test Set ===")

    # Get info
    r = requests.get(f"{BASE_URL}/test-set")
    data = r.json()
    print(f"GET /test-set: {r.status_code}")
    print(f"  - Total cases: {data['total']}")
    print(f"  - Categories: {len(data['categories'])}")
    assert r.status_code == 200

    # Get cases with filter
    r = requests.get(f"{BASE_URL}/test-set/cases?category=SHIPPING&limit=5")
    data = r.json()
    print(f"GET /test-set/cases?category=SHIPPING&limit=5: {r.status_code} - {len(data['cases'])} cases")
    assert r.status_code == 200


def test_suggest():
    """Test suggest endpoint (requires Maitai connection)."""
    print("\n=== Suggest ===")

    payload = {
        "prompt_id": "v1",
        "prompt_template": "Classify this ticket: {ticket}",
        "metrics": {"overall_accuracy": 0.93, "correct": 185, "total": 198},
        "category_stats": {"SHIPPING": {"total": 18, "correct": 15}},
        "confusion_matrix": {"SHIPPING": {"SHIPPING": 15, "DELIVERY": 3}},
        "failed_cases": [
            {"ticket": "Where is my package?", "expected": "SHIPPING", "predicted": "DELIVERY"}
        ]
    }

    try:
        r = requests.post(f"{BASE_URL}/suggest", json=payload, timeout=30)
        if r.status_code == 200:
            data = r.json()
            print(f"POST /suggest: {r.status_code}")
            print(f"  - Priority categories: {data['priority_categories']}")
            print(f"  - Suggestions: {len(data['suggestions'])} items")
        else:
            print(f"POST /suggest: {r.status_code} - {r.text[:100]}")
    except requests.exceptions.Timeout:
        print("POST /suggest: TIMEOUT (Maitai may be unavailable)")
    except Exception as e:
        print(f"POST /suggest: ERROR - {e}")


def main():
    """Run all tests."""
    print("=" * 50)
    print("API Test Suite")
    print(f"Testing: {BASE_URL}")
    print("=" * 50)

    try:
        test_health()
        test_prompts()
        test_runs()
        test_metrics()
        test_test_set()
        test_suggest()

        print("\n" + "=" * 50)
        print("All tests passed!")
        print("=" * 50)

    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
    except requests.exceptions.ConnectionError:
        print(f"\nERROR: Cannot connect to {BASE_URL}")
        print("Make sure the API is running: uvicorn api.main:app --reload --port 8000")


if __name__ == "__main__":
    main()
