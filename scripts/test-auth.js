const BASE_URL = 'http://localhost:3000'

async function testAuth() {
    console.log('Starting Auth Tests...')

    // 1. Test Login (Success)
    console.log('\n1. Testing Login (Success)...')
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' }),
    })

    if (loginRes.status === 200) {
        console.log('✅ Login successful')
    } else {
        console.error('❌ Login failed', await loginRes.json())
        return
    }

    const cookie = loginRes.headers.get('set-cookie')
    if (cookie) {
        console.log('✅ Cookie received')
    } else {
        console.error('❌ No cookie received')
    }

    // 2. Test Me (Success)
    console.log('\n2. Testing Me (Success)...')
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: cookie },
    })

    if (meRes.status === 200) {
        const data = await meRes.json()
        console.log('✅ Me successful', data.user.username)
    } else {
        console.error('❌ Me failed', await meRes.json())
    }

    // 3. Test Login (Failure)
    console.log('\n3. Testing Login (Failure)...')
    const failRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    })

    if (failRes.status === 401) {
        console.log('✅ Login failure handled correctly')
    } else {
        console.error('❌ Login failure not handled correctly', failRes.status)
    }

    // 4. Test Logout
    console.log('\n4. Testing Logout...')
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
    })

    if (logoutRes.status === 200) {
        console.log('✅ Logout successful')
    } else {
        console.error('❌ Logout failed')
    }
}

testAuth().catch(console.error)
