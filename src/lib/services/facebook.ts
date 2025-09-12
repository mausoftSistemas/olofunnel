import axios from 'axios'

export interface FacebookLead {
  id: string
  created_time: string
  ad_id?: string
  ad_name?: string
  adset_id?: string
  adset_name?: string
  campaign_id?: string
  campaign_name?: string
  form_id?: string
  field_data: Array<{
    name: string
    values: string[]
  }>
}

export interface FacebookCampaign {
  id: string
  name: string
  status: string
  objective?: string
  created_time: string
  updated_time: string
  daily_budget?: string
  lifetime_budget?: string
  targeting?: any
}

export interface FacebookInsights {
  impressions: number
  clicks: number
  spend: number
  cpm: number
  cpc: number
  ctr: number
  actions?: Array<{
    action_type: string
    value: number
  }>
}

export class FacebookService {
  private accessToken: string
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getCampaigns(adAccountId: string): Promise<FacebookCampaign[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/act_${adAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,targeting',
            limit: 100
          }
        }
      )

      return response.data.data || []
    } catch (error) {
      console.error('Error fetching Facebook campaigns:', error)
      throw new Error('Failed to fetch campaigns from Facebook')
    }
  }

  async getLeads(formId: string, since?: string): Promise<FacebookLead[]> {
    try {
      const params: any = {
        access_token: this.accessToken,
        fields: 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data',
        limit: 100
      }

      if (since) {
        params.since = since
      }

      const response = await axios.get(
        `${this.baseUrl}/${formId}/leads`,
        { params }
      )

      return response.data.data || []
    } catch (error) {
      console.error('Error fetching Facebook leads:', error)
      throw new Error('Failed to fetch leads from Facebook')
    }
  }

  async getCampaignInsights(
    campaignId: string, 
    dateRange: { since: string; until: string }
  ): Promise<FacebookInsights> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${campaignId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'impressions,clicks,spend,cpm,cpc,ctr,actions',
            time_range: JSON.stringify(dateRange),
            level: 'campaign'
          }
        }
      )

      const data = response.data.data[0] || {}
      
      return {
        impressions: parseInt(data.impressions || '0'),
        clicks: parseInt(data.clicks || '0'),
        spend: parseFloat(data.spend || '0'),
        cpm: parseFloat(data.cpm || '0'),
        cpc: parseFloat(data.cpc || '0'),
        ctr: parseFloat(data.ctr || '0'),
        actions: data.actions || []
      }
    } catch (error) {
      console.error('Error fetching campaign insights:', error)
      throw new Error('Failed to fetch campaign insights')
    }
  }

  async getAdAccounts(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me/adaccounts`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,account_status',
            limit: 100
          }
        }
      )

      return response.data.data
        .filter((account: any) => account.account_status === 1)
        .map((account: any) => ({
          id: account.id.replace('act_', ''),
          name: account.name
        }))
    } catch (error) {
      console.error('Error fetching ad accounts:', error)
      throw new Error('Failed to fetch ad accounts')
    }
  }

  async getLeadForms(adAccountId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/act_${adAccountId}/leadgen_forms`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,status,created_time',
            limit: 100
          }
        }
      )

      return response.data.data
        .filter((form: any) => form.status === 'ACTIVE')
        .map((form: any) => ({
          id: form.id,
          name: form.name
        }))
    } catch (error) {
      console.error('Error fetching lead forms:', error)
      throw new Error('Failed to fetch lead forms')
    }
  }

  static parseLeadData(lead: FacebookLead): {
    name?: string
    email?: string
    phone?: string
    age?: number
    gender?: string
    location?: string
    interests?: string[]
  } {
    const data: any = {}
    
    lead.field_data.forEach(field => {
      const value = field.values[0]
      
      switch (field.name.toLowerCase()) {
        case 'full_name':
        case 'name':
        case 'first_name':
          data.name = value
          break
        case 'email':
          data.email = value
          break
        case 'phone_number':
        case 'phone':
          data.phone = value
          break
        case 'age':
          data.age = parseInt(value)
          break
        case 'gender':
          data.gender = value
          break
        case 'city':
        case 'location':
        case 'state':
          data.location = value
          break
        case 'interests':
          data.interests = value.split(',').map((i: string) => i.trim())
          break
      }
    })

    return data
  }

  async setupWebhook(webhookUrl: string, verifyToken: string, formIds: string[]): Promise<boolean> {
    try {
      // Configurar webhook para cada formulario
      for (const formId of formIds) {
        await axios.post(
          `${this.baseUrl}/${formId}/subscriptions`,
          {
            object: 'leadgen',
            callback_url: webhookUrl,
            verify_token: verifyToken,
            fields: 'leadgen'
          },
          {
            params: {
              access_token: this.accessToken
            }
          }
        )
      }

      return true
    } catch (error) {
      console.error('Error setting up Facebook webhook:', error)
      return false
    }
  }
}