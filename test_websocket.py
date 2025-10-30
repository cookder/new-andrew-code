#!/usr/bin/env python3
"""
Simple WebSocket test client to demonstrate audio streaming
This simulates what the frontend will do
"""
import asyncio
import websockets
import json
import base64
import random

async def test_websocket():
    uri = "ws://localhost:8000/ws/test-session-123"

    print("🔌 Connecting to WebSocket server...")

    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected!")

            # Receive connection confirmation
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 Received: {data}")

            # Send a ping
            print("\n📤 Sending ping...")
            await websocket.send(json.dumps({
                "type": "ping",
                "timestamp": 1234567890
            }))

            # Receive pong
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 Received: {data}")

            # Simulate sending audio chunks
            print("\n🎤 Simulating audio stream (5 chunks)...")
            for i in range(5):
                # Create fake audio data (in real app, this comes from microphone)
                fake_audio = bytes([random.randint(0, 255) for _ in range(1024)])

                # Send as binary data
                await websocket.send(fake_audio)
                print(f"  📤 Sent chunk {i+1} ({len(fake_audio)} bytes)")

                await asyncio.sleep(0.1)  # 100ms between chunks

                # Check for acknowledgments
                try:
                    response = await asyncio.wait_for(
                        websocket.recv(),
                        timeout=0.05
                    )
                    data = json.loads(response)
                    if data['type'] == 'audio_ack':
                        print(f"  ✅ ACK: {data['chunks_received']} chunks received")
                except asyncio.TimeoutError:
                    pass  # No ack yet

            # Wait a moment for final ack
            await asyncio.sleep(0.2)
            try:
                response = await asyncio.wait_for(
                    websocket.recv(),
                    timeout=0.5
                )
                data = json.loads(response)
                print(f"📨 Final ACK: {data}")
            except asyncio.TimeoutError:
                print("⏰ No final ACK (expected)")

            # Send stop signal
            print("\n🛑 Sending stop signal...")
            await websocket.send(json.dumps({"type": "stop"}))

            # Receive stopped confirmation
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 Received: {data}")

            print("\n✨ Test completed successfully!")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("  WebSocket Audio Streaming Test")
    print("=" * 60)
    asyncio.run(test_websocket())
